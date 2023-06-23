const mongoose = require("mongoose");
const BookModel = require("../models/books");
const Pagination = require("../models/pagination");
const Error = require("../models/error");


/**
 * Retrieve all Books from the database.
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
        const count = await BookModel.countDocuments();
        const totalPages = Math.ceil(count / limit);

        const books = await
            BookModel.find(condition)
                .skip((page - 1) * limit)
                .limit(limit)
                .exec();

        res.json(new Pagination(books, page, totalPages));
    } catch (error) {
        res.status(500)
            .json(new Error(error.message || "Some error occurred while retrieving books."));
    }
};

/**
 * Retrieve a book with book id
 * @param {*} req 
 * @param {*} res 
 */
function findOne(req, res) {
    const id = req.params.bookId;

    BookModel.findById(id)
        .then(data => {
            if (!data)
                res.status(404)
                    .send(new Error("Not found Book with id " + id));
            else res.json(data);
        })
        .catch(err => {
            res.status(500)
                .send(new Error(err.message || "Some error occurred while retrieving books."));
        });
};

/**
 * Create a book
 * @param {*} req 
 * @param {*} res 
 */
function create(req, res) {
    const {title, quantity, price, description, categoryId, userId} = req.body;
    // Validate request
    if (!title) {
        res.status(400)
            .send(new Error("Content can not be empty!"));
        return;
    }

    // Create a Book
    const book = new BookModel({
        _id: new mongoose.Types.ObjectId(),
        title: title,
        quantity: quantity,
        price: price,
        description: description,
        categoryId: categoryId,
        image: "test",
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
                .send(new Error(err.message || "Some error occurred while creating the Book."));
        });
};

/**
 * Update a book by bookId
 * @param {*} req 
 * @param {*} res 
 */
function updateByBookId(req, res) {
    if (!req.body) {
        return res.status(400)
            .send(new Error("Data to update can not be empty!"));
    }

    const id = req.params.bookId;

    BookModel.findByIdAndUpdate(id, req.body, { useFindAndModify: false })
        .then(data => {
            if (!data) {
                res.status(404)
                    .send(new Error("Could not delete Book with id " + id));
            } else res.send({ message: "Book was updated successfully." });
        })
        .catch(err => {
            res.status(500)
                .send(new Error("Error updating Book with id " + id));
        });
};

/**
 * Delete a book by bookId
 * @param {*} req 
 * @param {*} res 
 */
function deleteByBookId(req, res) {
    const id = req.params.bookId;

    BookModel.findByIdAndRemove(id, { useFindAndModify: false })
        .then(data => {
            if (!data) {
                res.status(404).send({ message: "Not found Book with id " + id });
            } else {
                res.status(204).send();
            }
        })
        .catch(err => {
            res.status(500)
                .send(new Error("Could not delete Book with id " + id));
        });
};

module.exports = { findAll, findOne, create, updateByBookId, deleteByBookId }