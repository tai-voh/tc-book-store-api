import mongoose from"mongoose";
import CartModel from "../models/carts";
import UserModel from "../models/users";
import BookModel from "../models/books";
import OrderModel from "../models/orders";
import CustomerModel from "../models/customers";
import Pagination from "../models/pagination";
import Error from "../models/error";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { producer, orderConsumer} from "../config/kafka";
import { minioClient, orderBucketName, saveContent } from "../config/minio";
import { registry } from "../config/schema";

const topic = 'orders';
/**
 * Save requests to Kafka as message
 */
async function saveMessage(data) {
  console.log('Save order')
  await producer.connect();
  await producer.send({
      topic: topic,
      messages: [
          {
              key: 'key',
              value: JSON.stringify(data)
          }
      ]
  });
  await producer.disconnect();
}

/**
 * Execute requests via Kafka
 */
async function executeRequest() {
  try {
    console.log('executeRequest')
      await orderConsumer.connect();
      await orderConsumer.subscribe({ topics: [topic] });
      await orderConsumer.run({
          eachMessage: async ({message}) => {
            const data = JSON.parse(message.value?.toString()!);
            if (data.items.length) {
              saveToMinio(data)
            } else {
              console.log('Error when execute order request');
            }
          },
      })
  }
  catch (error) {
      console.log(error? error['message'] : "Execute request failed");
  }
}
executeRequest();

/**
 * Save requests to Minio
 */
async function saveToMinio(data) {
  try {
    console.log('saveToMinio')
      await saveContent('orders', data);
  } catch (error) {
      console.log(error? error['message'] : "Some error occurred while saving order message to Minio.")
  }
}

/**
 * Retrieve all Orders from the database.
 * @param {*} req
 * @param {*} res
 */
async function findAll(req, res) {
  const queries = req.query;
  // Apply filter and pagination here
  const condition = {};

  const page = parseInt(queries.page) || 1; // Current page number
  const limit = parseInt(queries.limit) || 10; // Number of results per page

  try {
    const count = await OrderModel.countDocuments();
    const totalPages = Math.ceil(count / limit);

    const orders = await OrderModel.find(condition)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    res.json(new Pagination(orders, page, count));
  } catch (error) {
    res
      .status(500)
      .json(
        new Error(
          error
            ? error["message"]
            : "Some error occurred while retrieving orders."
        )
      );
  }
}

/**
 * Update stock quantity for items
 * @param {*} items
 * @param {*} res
 */
async function checkItems(items, res) {
  if (items) {
    try {
      items.forEach(item => {
        BookModel.findById(item.productId)
          .then(data => {
              if (!data) {
                data = {
                  title: 'test',
                  price: 0,
                  quantity: 0
                }
              }
              item.title = data.title;
              item.price = data.price;
              item.stockQuantity = data.quantity;
          })
          .catch(err => {
              res.status(500)
                  .send(new Error(err.message || "Some error occurred while retrieving books."));
          });
      })
    } catch (error) {
      res
        .status(500)
        .json(
          new Error(
            error
              ? error["message"]
              : "Some error occurred while retrieving cart."
          )
        );
    } 
  }
  return items;
}

/**
 * Retrieve a order with order id
 * @param {*} req
 * @param {*} res
 */
async function findOne(req, res) {
  const id = req.params.orderId;

  OrderModel.findById(id).lean()
    .then(async (data) => {
      if (!data)
        res.status(404).send(new Error("Not found order with id " + id));
      else {
        data.items = await checkItems(data.items, res);
        if (data.customerId) {
          data.customer = await CustomerModel.findById(data.customerId.toString());
        }
        res.send(data);
      }
    })
    .catch((err) => {
      res
        .status(500)
        .send(
          new Error(
            err.message || "Some error occurred while retrieving order."
          )
        );
    });
}

/**
 * Retrieve orders with user id
 * @param {*} req
 * @param {*} res
 */
async function findByUser(req, res) {
  const userId = req.params.userId;
  const queries = req.query;
  // Apply filter and pagination here

  const page = parseInt(queries.page) || 1; // Current page number
  const limit = parseInt(queries.limit) || 10; // Number of results per page

  try {
    const count = await OrderModel.countDocuments({userId});
    const totalPages = Math.ceil(count / limit);

    const orders = await OrderModel.find({userId})
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    res.json(new Pagination(orders, page, count));
  } catch (error) {
    res
      .status(500)
      .json(
        new Error(
          error
            ? error["message"]
            : "Some error occurred while retrieving orders."
        )
      );
  }
}

/**
 * Create order
 * @param {*} req
 * @param {*} res
 */
async function create(req, res) {
  // Validate request
  const { userId, cartId, customerId } = req.body;
  if (!customerId) {
    res.status(400).send(new Error("No customer for order"));
    return;
  }

  if (!userId) {
    res.status(400).send(new Error("No user for order"));
    return;
  }
  else {
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(400).send(new Error("User is not exist"));
      return;
    }
  }

  let cart:any = {};
  if (!cartId) {
    res.status(400).send(new Error("No cart for order"));
    return;
  }
  else {
    cart = await CartModel.findById(cartId);
    if (!cart) {
      res.status(400).send(new Error("Cart is not exist"));
      return;
    }
    if (cart.userId != userId) {
      res.status(400).send(new Error("Invalid card id or user id"));
      return;
    }
  }

  let cartItems = cart.items;
  if (!cartItems || !cartItems.length) {
    res.status(400).send(new Error("No item in cart"));
    return;
  }

  try {
    let orderItems: any = [];
    let updateItems: any = [];
    for (let i of cartItems) {
      const productDetails = await BookModel.findById(i.productId);
      if (productDetails && i.quantity <= productDetails.quantity) {
        orderItems.push({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
          title: i.title
        });
        const remainQuantity = productDetails.quantity - i.quantity;
        updateItems.push({
          productId: i.productId,
          quantity: remainQuantity
        });
      }
      else {
        res.status(400).send(new Error("Item is invalid"));
        return;
      }
    }

    const order = new OrderModel({
      _id: new mongoose.Types.ObjectId(),
      userId: userId,
      customerId: customerId,
      createdDate: Date.now(),
      status: 'received',
      items: orderItems
    });

    order
      .save(order)
      .then(async (orderData) => {
        for(let i of updateItems) {
          await BookModel.findByIdAndUpdate(i.productId, {quantity: i.quantity}, { useFindAndModify: false });
        }
        await CartModel.findByIdAndRemove(cartId);
        await saveMessage(orderData);
        res.status(200).send(orderData);
      })
  } catch (error) {
    res
      .status(500)
      .json(
        new Error(
          error ? error["message"] : "Creating order failed."
        )
      );
  }
}

/**
 * Update customer info of order
 * @param {*} req
 * @param {*} res
 */
async function update(req, res) {
  // Validate request
  const { userId, customerInfo } = req.body;
  const orderId = req.params.orderId;
  if (!customerInfo || !customerInfo?.firstName || !customerInfo?.lastName || !customerInfo?.email || !customerInfo?.tel || !customerInfo?.address) {
    res.status(400).send(new Error("No customer information for order"));
    return;
  }
  if (!userId) {
    res.status(400).send(new Error("No user for order"));
    return;
  }
  else {
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(400).send(new Error("User is not exist"));
      return;
    }
  }

  try {
    OrderModel.findByIdAndUpdate(orderId, { customerInfo: customerInfo}, { useFindAndModify: false })
    .then(async (data) => {
      if (!data) {
        res.status(404).send(new Error("Could not update Order with id " + orderId));
      } else {
        res.send({ message: "Order was updated successfully." });
        await saveMessage(data);
      }
    })
    .catch((err) => {
      res.status(500).send(new Error("Error updating Order with id " + orderId));
    });
  } catch (error) {
    res
      .status(500)
      .json(
        new Error(
          error ? error["message"] : "Some error occurred while updating cart."
        )
      );
  }
}

/**
 * Delete a order by orderId
 * @param {*} req
 * @param {*} res
 */
function deleteByUserId(req, res) {
  const id = req.params.orderId;

  OrderModel.findByIdAndRemove(id, { useFindAndModify: false })
    .then((data) => {
      if (!data) {
        res.status(404).send({ message: "Not found Order with id " + id });
      } else {
        res.status(204).send();
      }
    })
    .catch((err) => {
      res.status(500).send(new Error("Could not delete Order with id " + id));
      
    });
}

export { findAll, findOne, findByUser, create, update, deleteByUserId };
