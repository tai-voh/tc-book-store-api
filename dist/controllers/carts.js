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
exports.deleteByCartId = exports.updateCart = exports.findOneByUser = exports.findOne = exports.findAll = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const carts_1 = __importDefault(require("../models/carts"));
const users_1 = __importDefault(require("../models/users"));
const books_1 = __importDefault(require("../models/books"));
const pagination_1 = __importDefault(require("../models/pagination"));
const error_1 = __importDefault(require("../models/error"));
/**
 * Retrieve all Carts from the database.
 * @param {*} req
 * @param {*} res
 */
function findAll(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const queries = req.query;
        // Apply filter and pagination here
        let condition = {};
        const page = parseInt(queries.page) || 1; // Current page number
        const limit = parseInt(queries.limit) || 10; // Number of results per page
        try {
            const count = yield carts_1.default.countDocuments();
            const totalPages = Math.ceil(count / limit);
            const carts = yield carts_1.default.find(condition)
                .skip((page - 1) * limit)
                .limit(limit)
                .exec();
            res.json(new pagination_1.default(carts, page, totalPages));
        }
        catch (error) {
            res
                .status(500)
                .json(new error_1.default(error
                ? error["message"]
                : "Some error occurred while retrieving carts."));
        }
    });
}
exports.findAll = findAll;
/**
 * Update stock quantity for items
 * @param {*} items
 * @param {*} res
 */
function checkItems(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const items = data === null || data === void 0 ? void 0 : data.items;
        if (items) {
            for (let item of items) {
                let itemData = yield books_1.default.findById(item.productId);
                if (!itemData) {
                    itemData = {
                        title: item.title,
                        price: item.price,
                        quantity: 0
                    };
                }
                item.title = itemData.title;
                item.price = itemData.price;
                item.stockQuantity = itemData.quantity;
            }
        }
        return data;
    });
}
/**
 * Retrieve a cart with cart id
 * @param {*} req
 * @param {*} res
 */
function findOne(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const id = req.params.cartId;
        carts_1.default.findById(id)
            .then((data) => __awaiter(this, void 0, void 0, function* () {
            if (!data)
                res.status(404).send(new error_1.default("Not found"));
            else {
                const data1 = yield checkItems(data);
                res.send(data1);
            }
        }))
            .catch((err) => {
            res
                .status(500)
                .send(new error_1.default(err.message || "Some error occurred while retrieving cart."));
        });
    });
}
exports.findOne = findOne;
/**
 * Retrieve a cart with user id
 * @param {*} req
 * @param {*} res
 */
function findOneByUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const userId = req.params.userId;
        carts_1.default.findOne({ userId })
            .then((data) => __awaiter(this, void 0, void 0, function* () {
            if (!data)
                res.status(404).send(new error_1.default("Not found"));
            else {
                const data1 = yield checkItems(data);
                res.send(data1);
            }
        }))
            .catch((err) => {
            res
                .status(500)
                .send(new error_1.default(err.message || "Some error occurred while retrieving cart."));
        });
    });
}
exports.findOneByUser = findOneByUser;
/**
 * Update items to cart
 * @param {*} req
 * @param {*} res
 */
function updateCart(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // Validate request
        const { userId, items, update } = req.body;
        const cartId = req.params.cartId;
        let oldCart;
        if (!userId) {
            res.status(400).send(new error_1.default("No user for cart"));
            return;
        }
        else {
            const oldUser = yield users_1.default.findById(userId);
            if (!oldUser) {
                res.status(400).send(new error_1.default("User is not exist"));
                return;
            }
        }
        if (cartId) {
            oldCart = yield carts_1.default.findById(cartId);
            if (!oldCart) {
                res.status(400).send(new error_1.default("Cart is not exist"));
                return;
            }
            if (oldCart.userId != userId) {
                res.status(400).send(new error_1.default("Invalid card id or user id"));
                return;
            }
        }
        if (!oldCart) {
            oldCart = yield carts_1.default.findOne({ userId });
            if (oldCart && cartId && oldCart.id !== cartId) {
                res.status(400).send(new error_1.default("Invalid user id or card id"));
                return;
            }
        }
        if (!items) {
            res.status(400).send(new error_1.default("No item to update"));
            return;
        }
        try {
            let cart = {};
            if (oldCart) {
                cart = oldCart;
                for (let item of items) {
                    cart = yield updateItemToCart(oldCart, item, update, res);
                }
            }
            else {
                cart = new carts_1.default({
                    _id: new mongoose_1.default.Types.ObjectId(),
                    userId: userId,
                    items: []
                });
                for (let item of items) {
                    cart = yield updateItemToCart(cart, item, false, res);
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
                    .send(new error_1.default(err.message || "Some error occurred while saving cart."));
            });
        }
        catch (error) {
            res
                .status(500)
                .json(new error_1.default(error ? error["message"] : "Some error occurred while updating cart."));
        }
    });
}
exports.updateCart = updateCart;
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
                cart.items[indexFound].quantity = update ? item.quantity : cart.items[indexFound].quantity + item.quantity;
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
 * Delete a cart by cartId
 * @param {*} req
 * @param {*} res
 */
function deleteByCartId(req, res) {
    const id = req.params.cartId;
    carts_1.default.findByIdAndRemove(id, { useFindAndModify: false })
        .then((data) => {
        if (!data) {
            res.status(404).send({ message: "Not found" });
        }
        else {
            res.status(204).send();
        }
    })
        .catch((err) => {
        res.status(500).send(new error_1.default("Could not delete Cart with id " + id));
    });
}
exports.deleteByCartId = deleteByCartId;
