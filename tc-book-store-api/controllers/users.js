const mongoose = require("mongoose");
const UserModel = require("../models/users");
const Pagination = require("../models/pagination");
const Error = require("../models/error");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


/**
 * Retrieve all Users from the database.
 * @param {*} req 
 * @param {*} res 
 */
async function findAll(req, res) {
    const queries = req.query;
    // Apply filter and pagination here
    var condition = {};

    const page = parseInt(queries.page) || 1; // Current page number
    const limit = parseInt(queries.limit) || 10; // Number of results per page

    try {
        const count = await UserModel.countDocuments();
        const totalPages = Math.ceil(count / limit);

        const users = await
            UserModel.find(condition)
                .skip((page - 1) * limit)
                .limit(limit)
                .exec();

        res.json(new Pagination(users, page, totalPages));
    } catch (error) {
        res.status(500)
            .json(new Error(error.message || "Some error occurred while retrieving users."));
    }
};

/**
 * Retrieve an user with user id
 * @param {*} req 
 * @param {*} res 
 */
function findOne(req, res) {
    const id = req.params.bookId;

    UserModel.findById(id)
        .then(data => {
            if (!data)
                res.status(404)
                    .send(new Error("Not found User with id " + id));
            else res.send(data);
        })
        .catch(err => {
            res.status(500)
                .send(new Error(err.message || "Some error occurred while retrieving users."));
        });
};

/**
 * Login an user with user email & password
 * @param {*} req 
 * @param {*} res 
 */
async function login(req, res) {
    const email = req.body.email;
    var password = req.body.password;
    try {

    
        const user = await UserModel.findOne({email});
        
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
        }
        else {
            res.status(404)
            .send(new Error("Invalid email or password"));
        }
                
            
        
    }
    catch(err) {
        res.status(500)
            .send(new Error(err.message || "Some error occurred while retrieving users."));
    };
};

/**
 * Create an user
 * @param {*} req 
 * @param {*} res 
 */
async function create(req, res) {
    // Validate request
    const {firstName, lastName, email, password, admin} = req.body;
    if (!( firstName && lastName && email && password)) {
        const test = JSON.stringify(req.body)
        console.log(test);
        res.status(400)
            .send(new Error("All input is required"));
        return;
    }

    try {
        const oldUser = await UserModel.findOne({email});
        if (oldUser) {
            res.status(409)
                .send(new Error("User already exist"));
            return;
        }

        //Encrypt user password
        encryptedPassword = await bcrypt.hash(password, 10);
    } catch (error) {
        res.status(500)
            .json(new Error(error.message || "Some error occurred while creating users."));
    }
    

    // Create a User
    const user = new UserModel({
        _id: new mongoose.Types.ObjectId(),
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: encryptedPassword,
        admin: admin
    });

    // Save User in the database
    user
        .save(user)
        .then(data => {
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
        .catch(err => {
            res.status(500)
                .send(new Error(err.message || "Some error occurred while creating the User."));
        });
};

/**
 * Update a user by userId
 * @param {*} req 
 * @param {*} res 
 */
function updateByUserId(req, res) {
    if (!req.body) {
        return res.status(400)
            .send(new Error("Data to update can not be empty!"));
    }

    const id = req.params.userId;

    UserModel.findByIdAndUpdate(id, req.body, { useFindAndModify: false })
        .then(data => {
            if (!data) {
                res.status(404)
                    .send(new Error("Could not delete User with id " + id));
            } else res.send({ message: "User was updated successfully." });
        })
        .catch(err => {
            res.status(500)
                .send(new Error("Error updating User with id " + id));
        });
};

/**
 * Delete a user by userId
 * @param {*} req 
 * @param {*} res 
 */
function deleteByUserId(req, res) {
    const id = req.params.userId;

    UserModel.findByIdAndRemove(id, { useFindAndModify: false })
        .then(data => {
            if (!data) {
                res.status(404).send({ message: "Not found User with id " + id });
            } else {
                res.status(204).send();
            }
        })
        .catch(err => {
            res.status(500)
                .send(new Error("Could not delete User with id " + id));
        });
};

module.exports = { findAll, findOne, login, create, updateByUserId, deleteByUserId }