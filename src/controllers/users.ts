import mongoose from"mongoose";
import UserModel from "../models/users";
import Pagination from "../models/pagination";
import Error from "../models/error";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

/**
 * Retrieve all Users from the database.
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
    const count = await UserModel.countDocuments();
    const totalPages = Math.ceil(count / limit);

    const users = await UserModel.find(condition)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    res.json(new Pagination(users, page, count));
  } catch (error) {
    res
      .status(500)
      .json(
        new Error(
          error
            ? error["message"]
            : "Some error occurred while retrieving users."
        )
      );
  }
}

/**
 * Retrieve an user with user id
 * @param {*} req
 * @param {*} res
 */
function findOne(req, res) {
  const id = req.params.userId;

  UserModel.findById(id)
    .then((data) => {
      if (!data)
        res.status(404).send(new Error("Not found User with id " + id));
      else res.send(data);
    })
    .catch((err) => {
      res
        .status(500)
        .send(
          new Error(
            err.message || "Some error occurred while retrieving users."
          )
        );
    });
}

/**
 * Login an user with user email & password
 * @param {*} req
 * @param {*} res
 */
async function login(req, res) {
  const email = req.body.email;
  const password = req.body.password;
  try {
    const user = await UserModel.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { user_id: user._id, email },
        process.env.TOKEN_KEY,
        {
          expiresIn: "24h",
        }
      );

      // save user token
      user.token = token;
      res.send(user);
    } else {
      res.status(404).send(new Error("Invalid email or password"));
    }
  } catch (err) {
    res
      .status(500)
      .send(
        new Error(
          err ? err["message"] : "Some error occurred while retrieving users."
        )
      );
  }
}

/**
 * Create an user
 * @param {*} req
 * @param {*} res
 */
async function create(req, res) {
  // Validate request
  const { firstName, lastName, email, password, admin } = req.body;
  if (!(firstName && lastName && email && password)) {
    res.status(400).send(new Error("All input is required"));
    return;
  }

  try {
    const oldUser = await UserModel.findOne({ email });
    if (oldUser) {
      res.status(409).send(new Error("User already exist"));
      return;
    }

    //Encrypt user password
    const encryptedPassword = await bcrypt.hash(password, 10);

    // Create a User
    const user = new UserModel({
      _id: new mongoose.Types.ObjectId(),
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: encryptedPassword,
      admin: admin,
    });

    // Save User in the database
    user
      .save(user)
      .then((data) => {
        // Create token
        const token = jwt.sign(
          { user_id: user._id, email },
          process.env.TOKEN_KEY,
          {
            expiresIn: "24h",
          }
        );
        user.token = data.token = token;
        res.status(201).send(data);
      })
      .catch((err) => {
        res
          .status(500)
          .send(
            new Error(
              err.message || "Some error occurred while creating the User."
            )
          );
      });
  } catch (error) {
    res
      .status(500)
      .json(
        new Error(
          error ? error["message"] : "Some error occurred while creating users."
        )
      );
  }
}

/**
 * Update a user by userId
 * @param {*} req
 * @param {*} res
 */
function update(req, res) {
  if (!req.body) {
    return res.status(400).send(new Error("Data to update can not be empty!"));
  }

  const id = req.params.userId;

  UserModel.findByIdAndUpdate(id, req.body, { useFindAndModify: false })
    .then((data) => {
      if (!data) {
        res.status(404).send(new Error("Could not update User with id " + id));
      } else res.send({ message: "User was updated successfully." });
    })
    .catch((err) => {
      res.status(500).send(new Error("Error updating User with id " + id));
    });
}

/**
 * Delete a user by userId
 * @param {*} req
 * @param {*} res
 */
function deleteByUserId(req, res) {
  const id = req.params.userId;

  UserModel.findByIdAndRemove(id, { useFindAndModify: false })
    .then((data) => {
      if (!data) {
        res.status(404).send({ message: "Not found User with id " + id });
      } else {
        res.status(204).send();
      }
    })
    .catch((err) => {
      res.status(500).send(new Error("Could not delete User with id " + id));
    });
}

export { findAll, findOne, login, create, update, deleteByUserId };
