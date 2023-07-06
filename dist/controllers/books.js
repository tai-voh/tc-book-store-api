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
exports.deleteByBookId = exports.updateByBookId = exports.create = exports.findOne = exports.findAll = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const books_1 = __importDefault(require("../models/books"));
const pagination_1 = __importDefault(require("../models/pagination"));
const error_1 = __importDefault(require("../models/error"));
/**
 * Retrieve all Books from the database.
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
            const count = yield books_1.default.countDocuments();
            const totalPages = Math.ceil(count / limit);
            const books = yield books_1.default.find(condition)
                .skip((page - 1) * limit)
                .limit(limit)
                .exec();
            res.json(new pagination_1.default(books, page, totalPages));
        }
        catch (error) {
            res.status(500)
                .json(new error_1.default(error ? error['message'] : "Some error occurred while retrieving books."));
        }
    });
}
exports.findAll = findAll;
;
/**
 * Retrieve a book with book id
 * @param {*} req
 * @param {*} res
 */
function findOne(req, res) {
    const id = req.params.bookId;
    books_1.default.findById(id)
        .then(data => {
        if (!data)
            res.status(404)
                .send(new error_1.default("Not found Book with id " + id));
        else
            res.json(data);
    })
        .catch(err => {
        res.status(500)
            .send(new error_1.default(err.message || "Some error occurred while retrieving books."));
    });
}
exports.findOne = findOne;
;
/**
 * Create a book
 * @param {*} req
 * @param {*} res
 */
function create(req, res) {
    const { title, quantity, price, description, file, categoryId, userId } = req.body;
    // Validate request
    if (!title || !quantity || !price || !file || !categoryId || !userId) {
        res.status(400)
            .send(new error_1.default("Invalid data"));
        return;
    }
    try {
        const filename = req.file.filename;
        // Create a Book
        const book = new books_1.default({
            _id: new mongoose_1.default.Types.ObjectId(),
            title: title,
            quantity: quantity,
            price: price,
            description: description,
            categoryId: categoryId,
            image: filename,
            userId: userId
        });
        // Save Book in the database
        book
            .save(book)
            .then(data => {
            res.status(201).send(data);
        })
            .catch(err => {
            res.status(500)
                .send(new error_1.default(err.message || "Some error occurred while creating the Book."));
        });
    }
    catch (error) {
        res.status(500)
            .json(new error_1.default(error ? error['message'] : "Some error occurred while retrieving books."));
        return;
    }
}
exports.create = create;
;
/**
 * Update a book by bookId
 * @param {*} req
 * @param {*} res
 */
function updateByBookId(req, res) {
    if (!req.body) {
        return res.status(400)
            .send(new error_1.default("Data to update can not be empty!"));
    }
    const id = req.params.bookId;
    books_1.default.findByIdAndUpdate(id, req.body, { useFindAndModify: false })
        .then(data => {
        if (!data) {
            res.status(404)
                .send(new error_1.default("Could not update Book with id " + id));
        }
        else
            res.send({ message: "Book was updated successfully." });
    })
        .catch(err => {
        res.status(500)
            .send(new error_1.default("Error updating Book with id " + id));
    });
}
exports.updateByBookId = updateByBookId;
;
/**
 * Delete a book by bookId
 * @param {*} req
 * @param {*} res
 */
function deleteByBookId(req, res) {
    const id = req.params.bookId;
    books_1.default.findByIdAndRemove(id, { useFindAndModify: false })
        .then(data => {
        if (!data) {
            res.status(404).send({ message: "Not found Book with id " + id });
        }
        else {
            res.status(204).send();
        }
    })
        .catch(err => {
        res.status(500)
            .send(new error_1.default("Could not delete Book with id " + id));
    });
}
exports.deleteByBookId = deleteByBookId;
;
