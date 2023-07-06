import mongoose from"mongoose";
import CartModel from "../models/carts";
import UserModel from "../models/users";
import BookModel from "../models/books";
import Pagination from "../models/pagination";
import Error from "../models/error";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

/**
 * Retrieve all Carts from the database.
 * @param {*} req
 * @param {*} res
 */
async function findAll(req, res) {
  const queries = req.query;
  // Apply filter and pagination here
  let condition = {};

  const page = parseInt(queries.page) || 1; // Current page number
  const limit = parseInt(queries.limit) || 10; // Number of results per page

  try {
    const count = await CartModel.countDocuments();
    const totalPages = Math.ceil(count / limit);

    const carts = await CartModel.find(condition)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    res.json(new Pagination(carts, page, totalPages));
  } catch (error) {
    res
      .status(500)
      .json(
        new Error(
          error
            ? error["message"]
            : "Some error occurred while retrieving carts."
        )
      );
  }
}

/**
 * Update stock quantity for items
 * @param {*} items
 * @param {*} res
 */
async function checkItems(data) {
  const items = data?.items;
  if (items) {
      for (let item of items) {
        let itemData = await BookModel.findById(item.productId)
        
        if (!itemData) {
          itemData = {
            title: item.title,
            price: item.price,
            quantity: 0
          }
        }
        item.title = itemData.title;
        item.price = itemData.price;
        item.stockQuantity = itemData.quantity;
      }
  }
  return data;
}

/**
 * Retrieve a cart with cart id
 * @param {*} req
 * @param {*} res
 */
async function findOne(req, res) {
  const id = req.params.cartId;

  CartModel.findById(id)
    .then(async (data) => {
      if (!data)
        res.status(404).send(new Error("Not found"));
      else {
        const data1 = await checkItems(data);
        res.send(data1);
        
      }
    })
    .catch((err) => {
      res
        .status(500)
        .send(
          new Error(
            err.message || "Some error occurred while retrieving cart."
          )
        );
    });
}

/**
 * Retrieve a cart with user id
 * @param {*} req
 * @param {*} res
 */
async function findOneByUser(req, res) {
  const userId = req.params.userId;

  CartModel.findOne({ userId })
    .then(async (data) => {
      if (!data)
        res.status(404).send(new Error("Not found"));
        else {
          const data1 = await checkItems(data);
          res.send(data1);
        }
    })
    .catch((err) => {
      res
        .status(500)
        .send(
          new Error(
            err.message || "Some error occurred while retrieving cart."
          )
        );
    });
}

/**
 * Update items to cart
 * @param {*} req
 * @param {*} res
 */
async function updateCart(req, res) {
  // Validate request
  const { userId, items, update } = req.body;
  const cartId = req.params.cartId;
  let oldCart;
  if (!userId) {
    res.status(400).send(new Error("No user for cart"));
    return;
  }
  else {
    const oldUser = await UserModel.findById(userId);
    if (!oldUser) {
      res.status(400).send(new Error("User is not exist"));
      return;
    }
  }

  if (cartId) {
    oldCart = await CartModel.findById(cartId);
    if (!oldCart) {
      res.status(400).send(new Error("Cart is not exist"));
      return;
    }
    if (oldCart.userId != userId) {
      res.status(400).send(new Error("Invalid card id or user id"));
      return;
    }
  }

  if (!oldCart) {
    oldCart = await CartModel.findOne({userId});
    if (oldCart && cartId && oldCart.id !== cartId) {
      res.status(400).send(new Error("Invalid user id or card id"));
      return;
    }
  }

  if (!items) {
    res.status(400).send(new Error("No item to update"));
    return;
  }

  try {
    let cart:any = {};
    if (oldCart) {
      cart = oldCart;
      for (let item of items) {
        cart = await updateItemToCart(oldCart, item, update, res);
      }
    }
    else {
      cart = new CartModel({
        _id: new mongoose.Types.ObjectId(),
        userId: userId,
        items: []
      });
      for (let item of items) {
        cart = await updateItemToCart(cart, item, false, res);
      }
    }

    cart
      .save(cart)
      .then((data) => {
        res.status(200).send(data);
      })
      .catch((err) => {
        res
          .status(500)
          .send(
            new Error(
              err.message || "Some error occurred while saving cart."
            )
          );
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
 * Update item in cart
 * @param {*} cart
 * @param {*} item
 * @param {*} res
 */
async function updateItemToCart(cart, item, update, res) {
  let productDetails = await BookModel.findById(item.productId);
  if (!productDetails) {
    productDetails = {
      price: 0,
      quantity: 0,
      title: ''
    }
  }

  try {
    //---- check if index exists ----
    const indexFound = cart.items.findIndex(i => i.productId == item.productId);
    //------this removes an item from the the cart if the quantity is set to zero
    if (indexFound !== -1 && item.quantity <= 0) {
        cart.items.splice(indexFound, 1);
    }
    //----------check if product exist,just add the previous quantity with the new quantity
    else if (indexFound !== -1) {
        cart.items[indexFound].quantity = update? item.quantity : cart.items[indexFound].quantity + item.quantity;
        cart.items[indexFound].price = productDetails.price;
        cart.items[indexFound].stockQuantity = productDetails.quantity;
        cart.items[indexFound].title = productDetails.title;
    }
    //----Check if Quantity is Greater than 0 then add item to items Array ----
    else if (item.quantity > 0) {
        cart.items.push({
            productId: item.productId,
            quantity: item.quantity,
            price: productDetails.price,
            stockQuantity: productDetails.quantity,
            title: productDetails.title
        })
    }
    return cart;
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
 * Delete a cart by cartId
 * @param {*} req
 * @param {*} res
 */
function deleteByCartId(req, res) {
  const id = req.params.cartId;

  CartModel.findByIdAndRemove(id, { useFindAndModify: false })
    .then((data) => {
      if (!data) {
        res.status(404).send({ message: "Not found"});
      } else {
        res.status(204).send();
      }
    })
    .catch((err) => {
      res.status(500).send(new Error("Could not delete Cart with id " + id));
    });
}

export { findAll, findOne, findOneByUser, updateCart, deleteByCartId };
