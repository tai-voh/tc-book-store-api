"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteByUserId = exports.updateByUserId = exports.create = exports.login = exports.findOne = exports.findAll = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const users_1 = __importDefault(require("../models/users"));
const pagination_1 = __importDefault(require("../models/pagination"));
const error_1 = __importDefault(require("../models/error"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * Retrieve all Users from the database.
 * @param {*} req
 * @param {*} res
 */
function findAll(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const queries = req.query;
        // Apply filter and pagination here
        var condition = {};
        const page = parseInt(queries.page) || 1; // Current page number
        const limit = parseInt(queries.limit) || 10; // Number of results per page
        try {
            const count = yield users_1.default.countDocuments();
            const totalPages = Math.ceil(count / limit);
            const users = yield users_1.default.find(condition)
                .skip((page - 1) * limit)
                .limit(limit)
                .exec();
            res.json(new pagination_1.default(users, page, totalPages));
        }
        catch (error) {
            res
                .status(500)
                .json(new error_1.default(error
                ? error["message"]
                : "Some error occurred while retrieving users."));
        }
    });
}
exports.findAll = findAll;
/**
 * Retrieve an user with user id
 * @param {*} req
 * @param {*} res
 */
function findOne(req, res) {
    const id = req.params.userId;
    users_1.default.findById(id)
        .then((data) => {
        if (!data)
            res.status(404).send(new error_1.default("Not found User with id " + id));
        else
            res.send(data);
    })
        .catch((err) => {
        res
            .status(500)
            .send(new error_1.default(err.message || "Some error occurred while retrieving users."));
    });
}
exports.findOne = findOne;
/**
 * Login an user with user email & password
 * @param {*} req
 * @param {*} res
 */
function login(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const email = req.body.email;
        var password = req.body.password;
        try {
            const user = yield users_1.default.findOne({ email });
            if (user && (yield bcryptjs_1.default.compare(password, user.password))) {
                const token = jsonwebtoken_1.default.sign({ user_id: user._id, email }, process.env.TOKEN_KEY, {
                    expiresIn: "24h",
                });
                // save user token
                user.token = token;
                res.send(user);
            }
            else {
                res.status(404).send(new error_1.default("Invalid email or password"));
            }
        }
        catch (err) {
            res
                .status(500)
                .send(new error_1.default(err ? err["message"] : "Some error occurred while retrieving users."));
        }
    });
}
exports.login = login;
/**
 * Create an user
 * @param {*} req
 * @param {*} res
 */
function create(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // Validate request
        const { firstName, lastName, email, password, admin } = req.body;
        if (!(firstName && lastName && email && password)) {
            res.status(400).send(new error_1.default("All input is required"));
            return;
        }
        try {
            const oldUser = yield users_1.default.findOne({ email });
            if (oldUser) {
                res.status(409).send(new error_1.default("User already exist"));
                return;
            }
            //Encrypt user password
            const encryptedPassword = yield bcryptjs_1.default.hash(password, 10);
            // Create a User
            const user = new users_1.default({
                _id: new mongoose_1.default.Types.ObjectId(),
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
                const token = jsonwebtoken_1.default.sign({ user_id: user._id, email }, process.env.TOKEN_KEY, {
                    expiresIn: "24h",
                });
                user.token = data.token = token;
                res.status(201).send(data);
            })
                .catch((err) => {
                res
                    .status(500)
                    .send(new error_1.default(err.message || "Some error occurred while creating the User."));
            });
        }
        catch (error) {
            res
                .status(500)
                .json(new error_1.default(error ? error["message"] : "Some error occurred while creating users."));
        }
    });
}
exports.create = create;
/**
 * Update a user by userId
 * @param {*} req
 * @param {*} res
 */
function updateByUserId(req, res) {
    if (!req.body) {
        return res.status(400).send(new error_1.default("Data to update can not be empty!"));
    }
    const id = req.params.userId;
    users_1.default.findByIdAndUpdate(id, req.body, { useFindAndModify: false })
        .then((data) => {
        if (!data) {
            res.status(404).send(new error_1.default("Could not update User with id " + id));
        }
        else
            res.send({ message: "User was updated successfully." });
    })
        .catch((err) => {
        res.status(500).send(new error_1.default("Error updating User with id " + id));
    });
}
exports.updateByUserId = updateByUserId;
/**
 * Delete a user by userId
 * @param {*} req
 * @param {*} res
 */
function deleteByUserId(req, res) {
    const id = req.params.userId;
    users_1.default.findByIdAndRemove(id, { useFindAndModify: false })
        .then((data) => {
        if (!data) {
            res.status(404).send({ message: "Not found User with id " + id });
        }
        else {
            res.status(204).send();
        }
    })
        .catch((err) => {
        res.status(500).send(new error_1.default("Could not delete User with id " + id));
    });
}
exports.deleteByUserId = deleteByUserId;
