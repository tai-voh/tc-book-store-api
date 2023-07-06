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
exports.deleteByUserId = exports.update = exports.create = exports.findByUser = exports.findOne = exports.findAll = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const carts_1 = __importDefault(require("../models/carts"));
const users_1 = __importDefault(require("../models/users"));
const books_1 = __importDefault(require("../models/books"));
const orders_1 = __importDefault(require("../models/orders"));
const pagination_1 = __importDefault(require("../models/pagination"));
const error_1 = __importDefault(require("../models/error"));
/**
 * Retrieve all Orders from the database.
 * @param {*} req
 * @param {*} res
 */
function findAll(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const queries = req.query;
        // Apply filter and pagination here
        const condition = {};
        const page = parseInt(queries.page) || 1; // Current page number
        const limit = parseInt(queries.limit) || 10; // Number of results per page
        try {
            const count = yield orders_1.default.countDocuments();
            const totalPages = Math.ceil(count / limit);
            const orders = yield orders_1.default.find(condition)
                .skip((page - 1) * limit)
                .limit(limit)
                .exec();
            res.json(new pagination_1.default(orders, page, count));
        }
        catch (error) {
            res
                .status(500)
                .json(new error_1.default(error
                ? error["message"]
                : "Some error occurred while retrieving orders."));
        }
    });
}
exports.findAll = findAll;
/**
 * Update stock quantity for items
 * @param {*} items
 * @param {*} res
 */
function checkItems(items, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (items) {
            try {
                items.forEach(item => {
                    books_1.default.findById(item.productId)
                        .then(data => {
                        if (!data) {
                            data = {
                                title: 'test',
                                price: 0,
                                quantity: 0
                            };
                        }
                        item.title = data.title;
                        item.price = data.price;
                        item.stockQuantity = data.quantity;
                    })
                        .catch(err => {
                        res.status(500)
                            .send(new error_1.default(err.message || "Some error occurred while retrieving books."));
                    });
                });
            }
            catch (error) {
                res
                    .status(500)
                    .json(new error_1.default(error
                    ? error["message"]
                    : "Some error occurred while retrieving cart."));
            }
        }
        return items;
    });
}
/**
 * Retrieve a order with order id
 * @param {*} req
 * @param {*} res
 */
function findOne(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const id = req.params.orderId;
        orders_1.default.findById(id)
            .then((data) => __awaiter(this, void 0, void 0, function* () {
            if (!data)
                res.status(404).send(new error_1.default("Not found order with id " + id));
            else {
                data.items = yield checkItems(data.items, res);
                res.send(data);
            }
        }))
            .catch((err) => {
            res
                .status(500)
                .send(new error_1.default(err.message || "Some error occurred while retrieving order."));
        });
    });
}
exports.findOne = findOne;
/**
 * Retrieve orders with user id
 * @param {*} req
 * @param {*} res
 */
function findByUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const userId = req.params.userId;
        const queries = req.query;
        // Apply filter and pagination here
        const page = parseInt(queries.page) || 1; // Current page number
        const limit = parseInt(queries.limit) || 10; // Number of results per page
        try {
            const count = yield orders_1.default.countDocuments({ userId });
            const totalPages = Math.ceil(count / limit);
            const orders = yield orders_1.default.find({ userId })
                .skip((page - 1) * limit)
                .limit(limit)
                .exec();
            res.json(new pagination_1.default(orders, page, count));
        }
        catch (error) {
            res
                .status(500)
                .json(new error_1.default(error
                ? error["message"]
                : "Some error occurred while retrieving orders."));
        }
    });
}
exports.findByUser = findByUser;
/**
 * Create order
 * @param {*} req
 * @param {*} res
 */
function create(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // Validate request
        const { userId, cartId, customerInfo } = req.body;
        if (!customerInfo || !(customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.firstName) || !(customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.lastName) || !(customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.email) || !(customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.tel) || !(customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.address)) {
            res.status(400).send(new error_1.default("No customer information for order"));
            return;
        }
        if (!userId) {
            res.status(400).send(new error_1.default("No user for order"));
            return;
        }
        else {
            const user = yield users_1.default.findById(userId);
            if (!user) {
                res.status(400).send(new error_1.default("User is not exist"));
                return;
            }
        }
        let cart = {};
        if (!cartId) {
            res.status(400).send(new error_1.default("No cart for order"));
            return;
        }
        else {
            cart = yield carts_1.default.findById(cartId);
            if (!cart) {
                res.status(400).send(new error_1.default("Cart is not exist"));
                return;
            }
            if (cart.userId != userId) {
                res.status(400).send(new error_1.default("Invalid card id or user id"));
                return;
            }
        }
        let cartItems = cart.items;
        if (!cartItems || !cartItems.length) {
            res.status(400).send(new error_1.default("No item in cart"));
            return;
        }
        try {
            let orderItems = [];
            let updateItems = [];
            for (let i of cartItems) {
                const productDetails = yield books_1.default.findById(i.productId);
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
                    res.status(400).send(new error_1.default("Item is invalid"));
                    return;
                }
            }
            const order = new orders_1.default({
                _id: new mongoose_1.default.Types.ObjectId(),
                userId: userId,
                customerInfo: {
                    firstName: customerInfo.firstName,
                    lastName: customerInfo.lastName,
                    email: customerInfo.email,
                    tel: customerInfo.tel,
                    address: customerInfo.address
                },
                createdDate: Date.now(),
                status: 'received',
                items: orderItems
            });
            order
                .save(order)
                .then((data) => __awaiter(this, void 0, void 0, function* () {
                for (let i of updateItems) {
                    yield books_1.default.findByIdAndUpdate(i.productId, { quantity: i.quantity }, { useFindAndModify: false });
                }
                yield carts_1.default.findByIdAndRemove(cartId);
                res.status(200).send(data);
            }));
        }
        catch (error) {
            res
                .status(500)
                .json(new error_1.default(error ? error["message"] : "Creating order failed."));
        }
    });
}
exports.create = create;
/**
 * Update customer info of order
 * @param {*} req
 * @param {*} res
 */
function update(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // Validate request
        const { userId, customerInfo } = req.body;
        const orderId = req.params.orderId;
        if (!customerInfo || !(customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.firstName) || !(customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.lastName) || !(customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.email) || !(customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.tel) || !(customerInfo === null || customerInfo === void 0 ? void 0 : customerInfo.address)) {
            res.status(400).send(new error_1.default("No customer information for order"));
            return;
        }
        if (!userId) {
            res.status(400).send(new error_1.default("No user for order"));
            return;
        }
        else {
            const user = yield users_1.default.findById(userId);
            if (!user) {
                res.status(400).send(new error_1.default("User is not exist"));
                return;
            }
        }
        try {
            orders_1.default.findByIdAndUpdate(orderId, { customerInfo: customerInfo }, { useFindAndModify: false })
                .then((data) => {
                if (!data) {
                    res.status(404).send(new error_1.default("Could not update Order with id " + orderId));
                }
                else
                    res.send({ message: "Order was updated successfully." });
            })
                .catch((err) => {
                res.status(500).send(new error_1.default("Error updating Order with id " + orderId));
            });
        }
        catch (error) {
            res
                .status(500)
                .json(new error_1.default(error ? error["message"] : "Some error occurred while updating cart."));
        }
    });
}
exports.update = update;
/**
 * Update item in cart
 * @param {*} cart
 * @param {*} item
 * @param {*} res
 */
function updateItemToCart(cart, item, update, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let productDetails = yield books_1.default.findById(item.productId);
        if (!productDetails) {
            productDetails = {
                price: 0,
                quantity: 0,
                title: ''
            };
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
                cart.items[indexFound].quantity = item.quantity;
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
                });
            }
            return cart;
        }
        catch (error) {
            res
                .status(500)
                .json(new error_1.default(error ? error["message"] : "Some error occurred while updating cart."));
        }
    });
}
/**
 * Delete a order by orderId
 * @param {*} req
 * @param {*} res
 */
function deleteByUserId(req, res) {
    const id = req.params.orderId;
    orders_1.default.findByIdAndRemove(id, { useFindAndModify: false })
        .then((data) => {
        if (!data) {
            res.status(404).send({ message: "Not found Order with id " + id });
        }
        else {
            res.status(204).send();
        }
    })
        .catch((err) => {
        res.status(500).send(new error_1.default("Could not delete Order with id " + id));
    });
}
exports.deleteByUserId = deleteByUserId;
