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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = exports.findByUser = exports.deleteByBookId = exports.update = exports.create = exports.findOne = exports.findAll = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const books_1 = __importDefault(require("../models/books"));
const pagination_1 = __importDefault(require("../models/pagination"));
const error_1 = __importDefault(require("../models/error"));
const kafka_1 = require("../config/kafka");
const minio_1 = require("../config/minio");
const schema_1 = require("../config/schema");
/**
 * Execute requests via Kafka
 */
const topic = 'book-requests';
function executeRequest() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield kafka_1.consumer.connect();
            yield kafka_1.consumer.subscribe({ topics: [topic] });
            yield kafka_1.consumer.run({
                eachMessage: ({ message }) => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    const data = JSON.parse((_a = message.value) === null || _a === void 0 ? void 0 : _a.toString());
                    const action = data === null || data === void 0 ? void 0 : data.action;
                    const id = data === null || data === void 0 ? void 0 : data.id;
                    const content = data === null || data === void 0 ? void 0 : data.content;
                    switch (action) {
                        case 'create':
                            if (yield createViaKafka(content)) {
                                saveToMinio(data);
                            }
                            break;
                        case 'update':
                            if (yield updateViaKafka(id, content)) {
                                saveToMinio(data);
                            }
                            break;
                        case 'deleteByBookId':
                            if (yield deleteByBookIdViaKafka(id)) {
                                saveToMinio(data);
                            }
                            // deleteByBookIdViaKafka(id);
                            break;
                        default:
                            console.log('Error when execute book request');
                    }
                }),
            });
        }
        catch (error) {
            console.log(error ? error['message'] : "Execute request failed");
        }
    });
}
executeRequest();
/**
 * Save requests to Minio
 */
function saveToMinio(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const registryId = yield (0, schema_1.registerSchema)();
            if (registryId) {
                const content = schema_1.registry.encode(registryId, data);
                minio_1.minioClient.putObject(minio_1.bookBucketName, `book-request-${Date.now()}`, content, function (err, etag) {
                    if (err)
                        return console.log(err);
                    console.log('Book message uploaded successfully.');
                });
            }
        }
        catch (error) {
            console.log(error ? error['message'] : "Some error occurred while saving book request message to Minio.");
        }
    });
}
/**
 * Receive requests and store in Kafka
 */
function request(req, res) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const _c = req.body, { action, id } = _c, content = __rest(_c, ["action", "id"]);
            let message = {};
            let filename = '';
            switch (action) {
                case 'create':
                    const { title, quantity, price, description, file, categoryId, userId } = content;
                    if (!title || !quantity || !price || !file || !categoryId || !userId) {
                        res.status(400)
                            .send(new error_1.default("Invalid data"));
                        return;
                    }
                    else {
                        const filename = ((_a = req.file) === null || _a === void 0 ? void 0 : _a.filename) || '';
                        content.image = filename;
                    }
                    break;
                case 'update':
                    if (!id) {
                        res.status(400)
                            .send(new error_1.default("Invalid book id"));
                        return;
                    }
                    if (!Object.keys(content).length) {
                        res.status(400)
                            .send(new error_1.default("Invalid data"));
                        return;
                    }
                    else {
                        const filename = ((_b = req.file) === null || _b === void 0 ? void 0 : _b.filename) || '';
                        if (filename) {
                            content.image = filename;
                        }
                    }
                    break;
                case 'deleteByBookId':
                    if (!id) {
                        res.status(400)
                            .send(new error_1.default("Invalid book id"));
                        return;
                    }
                    break;
                default:
                    res.status(400)
                        .send(new error_1.default("Invalid action"));
                    return;
            }
            message = {
                action: action,
                id: id,
                content: content
            };
            yield kafka_1.producer.connect();
            yield kafka_1.producer.send({
                topic: topic,
                messages: [
                    {
                        key: 'key',
                        value: JSON.stringify(message)
                    }
                ]
            });
            yield kafka_1.producer.disconnect();
            res.send({ message: "Send request successfully" });
        }
        catch (error) {
            res.status(400)
                .json(new error_1.default(error ? error['message'] : "Send request failed"));
        }
    });
}
exports.request = request;
/**
 * Retrieve all Books from the database.
 * @param {*} req
 * @param {*} res
 */
function findAll(req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const queries = req.query;
        // Apply filter and pagination here
        let condition = {};
        const searchKey = ((_a = queries.search) === null || _a === void 0 ? void 0 : _a.toString()) || '';
        if (searchKey) {
            const $regex = searchKey.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
            condition = {
                "$or": [
                    { title: { '$regex': $regex, '$options': 'i' } },
                    { description: { '$regex': $regex, '$options': 'i' } }
                ]
            };
        }
        const page = parseInt(queries.page) || 1; // Current page number
        const limit = parseInt(queries.limit) || 10; // Number of results per page
        try {
            const count = yield books_1.default.countDocuments(condition);
            let books = yield books_1.default.find(condition)
                .skip((page - 1) * limit)
                .limit(limit)
                .exec();
            res.json(new pagination_1.default(books, page, count));
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
 * Retrieve all Books of an user.
 * @param {*} req
 * @param {*} res
 */
function findByUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const userId = req.params.userId;
        const queries = req.query;
        // Apply filter and pagination here
        const condition = {};
        const page = parseInt(queries.page) || 1; // Current page number
        const limit = parseInt(queries.limit) || 10; // Number of results per page
        try {
            const count = yield books_1.default.countDocuments({ userId });
            let books = yield books_1.default.find(condition)
                .skip((page - 1) * limit)
                .limit(limit)
                .exec();
            res.json(new pagination_1.default(books, page, count));
        }
        catch (error) {
            res.status(500)
                .json(new error_1.default(error ? error['message'] : "Some error occurred while retrieving books."));
        }
    });
}
exports.findByUser = findByUser;
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
function update(req, res) {
    var _a;
    if (!req.body) {
        return res.status(400)
            .send(new error_1.default("Data to update can not be empty!"));
    }
    try {
        const id = req.params.bookId;
        const filename = (_a = req.file) === null || _a === void 0 ? void 0 : _a.filename;
        if (filename) {
            req.body.image = filename;
        }
        books_1.default.findByIdAndUpdate(id, req.body, { useFindAndModify: false })
            .then(data => {
            if (!data) {
                res.status(404)
                    .send(new error_1.default("Could not update Book with id " + id));
            }
            else
                res.send({ message: "Book was updated successfully." });
        });
    }
    catch (error) {
        res.status(500)
            .json(new error_1.default(error ? error['message'] : "Some error occurred while updating book."));
        return;
    }
}
exports.update = update;
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
/**
 * Create a book
 * @param {*} params
 */
function createViaKafka(params) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const book = new books_1.default({
                _id: new mongoose_1.default.Types.ObjectId(),
                title: params.title,
                quantity: params.quantity,
                price: params.price,
                description: params.description,
                categoryId: params.categoryId,
                image: params.image,
                userId: params.userId
            });
            // Save Book in the database
            book.save(book);
            return true;
        }
        catch (error) {
            console.log(error ? error['message'] : "Some error occurred while creating the Book.");
            return false;
        }
    });
}
;
/**
 * Update a book by bookId
 * @param {*} id
 * @param {*} params
 */
function updateViaKafka(id, params) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            books_1.default.findByIdAndUpdate(id, params, { useFindAndModify: false });
            return true;
        }
        catch (error) {
            console.log(error ? error['message'] : "Some error occurred while updating book.");
            return false;
        }
    });
}
;
/**
 * Delete a book by bookId
 * @param {*} id
 */
function deleteByBookIdViaKafka(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            books_1.default.findByIdAndRemove(id, { useFindAndModify: false });
            return true;
        }
        catch (error) {
            console.log(error ? error['message'] : "Some error occurred while deleting book.");
            return false;
        }
    });
}
;
