import mongoose from"mongoose";
import CustomerModel from "../models/customers";
import Pagination from "../models/pagination";
import Error from "../models/error";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

/**
 * Retrieve all customers from the database.
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
    const count = await CustomerModel.countDocuments();
    const totalPages = Math.ceil(count / limit);

    const customers = await CustomerModel.find(condition)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    res.json(new Pagination(customers, page, count));
  } catch (error) {
    res
      .status(500)
      .json(
        new Error(
          error
            ? error["message"]
            : "Some error occurred while retrieving customers."
        )
      );
  }
}

/**
 * Retrieve all customers of one user from the database.
 * @param {*} req
 * @param {*} res
 */
async function findByUser(req, res) {
  const queries = req.query;
  const userId = req.params.id;
  // Apply filter and pagination here
  const condition = {userId};

  const page = parseInt(queries.page) || 1; // Current page number
  const limit = parseInt(queries.limit) || 10; // Number of results per page

  try {
    const count = await CustomerModel.countDocuments(condition);
    const totalPages = Math.ceil(count / limit);

    const customers = await CustomerModel.find(condition)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    res.json(new Pagination(customers, page, count));
  } catch (error) {
    res
      .status(500)
      .json(
        new Error(
          error
            ? error["message"]
            : "Some error occurred while retrieving customers."
        )
      );
  }
}

/**
 * Retrieve an customer with customer id
 * @param {*} req
 * @param {*} res
 */
function findOne(req, res) {
  const id = req.params.id;

  CustomerModel.findById(id)
    .then((data) => {
      if (!data)
        res.status(404).send(new Error("Not found Customer with id " + id));
      else res.send(data);
    })
    .catch((err) => {
      res
        .status(500)
        .send(
          new Error(
            err.message || "Some error occurred while retrieving customer."
          )
        );
    });
}

/**
 * Create an customer
 * @param {*} req
 * @param {*} res
 */
async function create(req, res) {
  // Validate request
  const { userId, firstName, lastName, email, tel, address } = req.body;
  if (!(userId && firstName && lastName && email && tel && address)) {
    res.status(400).send(new Error("All input is required"));
    return;
  }

  try {
    // Create a Customer
    const customer = new CustomerModel({
      _id: new mongoose.Types.ObjectId(),
      firstName: firstName,
      lastName: lastName,
      email: email,
      tel: tel,
      address: address,
      userId: userId
    });

    // Save Customer in the database
    customer
      .save(customer)
      .then((data) => {
        res.status(201).send(data);
      })
      .catch((err) => {
        res
          .status(500)
          .send(
            new Error(
              err.message || "Some error occurred while creating the Customer."
            )
          );
      });
  } catch (error) {
    res
      .status(500)
      .json(
        new Error(
          error ? error["message"] : "Some error occurred while creating customer."
        )
      );
  }
}

/**
 * Update a customer by customerId
 * @param {*} req
 * @param {*} res
 */
function update(req, res) {
  if (!req.body) {
    return res.status(400).send(new Error("Data to update can not be empty!"));
  }

  const id = req.params.id;

  CustomerModel.findByIdAndUpdate(id, req.body, { useFindAndModify: false })
    .then((data) => {
      if (!data) {
        res.status(404).send(new Error("Could not update Customer with id " + id));
      } else res.send({ message: "Customer was updated successfully." });
    })
    .catch((err) => {
      res.status(500).send(new Error("Error updating Customer with id " + id));
    });
}

/**
 * Delete a Customer by id
 * @param {*} req
 * @param {*} res
 */
function deleteById(req, res) {
  const id = req.params.id;

  CustomerModel.findByIdAndRemove(id, { useFindAndModify: false })
    .then((data) => {
      if (!data) {
        res.status(404).send({ message: "Not found Customer with id " + id });
      } else {
        res.status(204).send();
      }
    })
    .catch((err) => {
      res.status(500).send(new Error("Could not delete Customer with id " + id));
    });
}

export { findAll, findByUser, findOne, create, update, deleteById };
