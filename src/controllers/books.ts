import mongoose from "mongoose";
import BookModel from "../models/books";
import Pagination from "../models/pagination";
import Error from "../models/error";
import { producer, bookConsumer} from "../config/kafka";
import { minioClient, bookBucketName, saveContent } from "../config/minio";
import { registry, registerBookSchema } from "../config/schema";
// import { runBookRequestJob } from "../jobs/book-requests-job";

/**
 * Execute requests via Kafka
 */
const topic = 'book-requests';
async function executeRequest() {
    try {
        await bookConsumer.connect();
        await bookConsumer.subscribe({ topics: [topic] });
        await bookConsumer.run({
            eachMessage: async ({message}) => {
                const data = JSON.parse(message.value?.toString()!);
                const action = data?.action;
                let id = data?.id;
                const content = data?.content;
                let result;
                switch(action) {
                    case 'create':
                        result = await createViaKafka(content);
                        if (result?.id) {
                            saveToMinio(action, id, result);
                        }
                        break;
                    case 'update':
                        result = await updateViaKafka(id, content);
                        if (result?.id) {
                            saveToMinio(action, id, result);
                        }
                        break;
                    case 'deleteByBookId':
                        result = await deleteByBookIdViaKafka(id);
                        if (result?.id) {
                            saveToMinio('delete', id, result);
                        }
                        break;
                    default:
                        console.log('Error when execute book request');
                }
            },
        })
    }
    catch (error) {
        console.log(error? error['message'] : "Execute request failed");
    }
}
executeRequest();
// runBookRequestJob();

/**
 * Save requests to Minio
 */
async function saveToMinio(action, id, data) {
    try {
        data.action = action;
        if (id) data.id = id;
        await saveContent('books', data);
    } catch (error) {
        console.log(error? error['message'] : "Some error occurred while saving book request message to Minio.")
    }
}

/**
 * Receive requests and store in Kafka
 */
async function request(req, res) {
    try {
        const {action, id, ...content} = req.body;
        let message = {};
        let filename = '';

        switch(action) {
            case 'create':
                const {title, quantity, price, description, file, categoryId, userId} = content;
                if (!title || !quantity || !price || !file || !categoryId || !userId) {
                    res.status(400)
                        .send(new Error("Invalid data"));
                    return;
                }
                else {
                    const filename = req.file?.filename || '';
                    content.image = filename;
                }
                break;
            case 'update':
                if (!id) {
                    res.status(400)
                        .send(new Error("Invalid book id"));
                    return;
                }
                if (!Object.keys(content).length) {
                    res.status(400)
                        .send(new Error("Invalid data"));
                    return;
                }
                else {
                    const filename = req.file?.filename || '';
                    if (filename) {
                        content.image = filename;
                    }
                }
                break;
            case 'deleteByBookId':
                if (!id) {
                    res.status(400)
                        .send(new Error("Invalid book id"));
                    return;
                }
                break;
            default:
                res.status(400)
                    .send(new Error("Invalid action"));
                return;
        }

        message = {
            action: action,
            id: id,
            content: content
        }

        await producer.connect();
        await producer.send({
            topic: topic,
            messages: [
                {
                    key: 'key',
                    value: JSON.stringify(message)
                }
            ]
        });
        await producer.disconnect();
        res.send({ message: "Send request successfully" });
    }
    catch (error) {
        res.status(400)
            .json(new Error(error? error['message'] : "Send request failed"));
    }
}

/**
 * Retrieve all Books from the database.
 * @param {*} req 
 * @param {*} res 
 */
async function findAll(req, res) {
    const queries = req.query;
    // Apply filter and pagination here
    let condition = {};
    const searchKey = queries.search?.toString() || '';
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
        const count = await BookModel.countDocuments(condition);

        let books = await
            BookModel.find(condition)
                .skip((page - 1) * limit)
                .limit(limit)
                .exec();

        res.json(new Pagination(books, page, count));
    } catch (error) {
        res.status(500)
            .json(new Error(error? error['message'] : "Some error occurred while retrieving books."));
    }
};

/**
 * Retrieve all Books of an user.
 * @param {*} req 
 * @param {*} res 
 */
async function findByUser(req, res) {
    const userId = req.params.userId;
    const queries = req.query;
    // Apply filter and pagination here
    const condition = {};
    const page = parseInt(queries.page) || 1; // Current page number
    const limit = parseInt(queries.limit) || 10; // Number of results per page

    try {
        const count = await BookModel.countDocuments({userId});

        let books = await
            BookModel.find(condition)
                .skip((page - 1) * limit)
                .limit(limit)
                .exec();

        res.json(new Pagination(books, page, count));
    } catch (error) {
        res.status(500)
            .json(new Error(error? error['message'] : "Some error occurred while retrieving books."));
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
    const {title, quantity, price, description, file, categoryId, userId} = req.body;
    // Validate request
    if (!title || !quantity || !price || !file || !categoryId || !userId) {
        res.status(400)
            .send(new Error("Invalid data"));
        return;
    }

    try {
        const filename = req.file.filename;
        // Create a Book
        const book = new BookModel({
            _id: new mongoose.Types.ObjectId(),
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
                    .send(new Error(err.message || "Some error occurred while creating the Book."));
            });
    } catch (error) {
        res.status(500)
            .json(new Error(error? error['message'] : "Some error occurred while retrieving books."));
        return
    }
};

/**
 * Update a book by bookId
 * @param {*} req 
 * @param {*} res 
 */
function update(req, res) {
    if (!req.body) {
        return res.status(400)
            .send(new Error("Data to update can not be empty!"));
    }

    try {
        const id = req.params.bookId;
        const filename = req.file?.filename;
        if (filename) {
            req.body.image = filename;
        }
        BookModel.findByIdAndUpdate(id, req.body, { useFindAndModify: false })
        .then(data => {
            if (!data) {
                res.status(404)
                    .send(new Error("Could not update Book with id " + id));
            } else res.send({ message: "Book was updated successfully." });
        })
    } catch (error) {
        res.status(500)
            .json(new Error(error? error['message'] : "Some error occurred while updating book."));
        return
    }
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

/**
 * Create a book
 * @param {*} params
 */
async function createViaKafka(params) {
    try {
        const book = new BookModel({
            _id: new mongoose.Types.ObjectId(),
            title: params.title,
            quantity: params.quantity,
            price: params.price,
            description: params.description,
            categoryId: params.categoryId,
            image: params.image,
            userId: params.userId
        });

        return await book.save(book).then((data) => {
            return data;
        });
    } catch (error) {
        console.log(error? error['message'] : "Some error occurred while creating the Book.")
        return false;
    }
};

/**
 * Update a book by bookId
 * @param {*} id 
 * @param {*} params 
 */
async function updateViaKafka(id, params) {
    try {
        
        return await BookModel.findByIdAndUpdate(id, params, { useFindAndModify: false }).then((data) => {
            return data;
        });
    } catch (error) {
        console.log(error? error['message'] : "Some error occurred while updating book.");
        return false;
    }
};

/**
 * Delete a book by bookId
 * @param {*} id
 */
async function deleteByBookIdViaKafka(id) {
    try {
        return await BookModel.findByIdAndRemove(id, { useFindAndModify: false }).then((data) => {
            return data;
        });
    } catch (error) {
        console.log(error? error['message'] : "Some error occurred while deleting book.");
        return false;
    }
};

export { findAll, findOne, create, update, deleteByBookId, findByUser, request }