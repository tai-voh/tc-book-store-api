"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const Schema = db_1.mongoose.Schema;
const ItemSchema = new Schema({
    productId: { type: db_1.mongoose.Schema.Types.ObjectId, ref: "BookModel" },
    quantity: { type: Number },
    price: { type: Number },
    title: { type: String }
});
const CustomerInfoSchema = new Schema({
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    tel: { type: String },
    address: { type: String }
});
const OrderSchema = new Schema({
    userId: { type: db_1.mongoose.Schema.Types.ObjectId, ref: "UserModel" },
    customerInfo: CustomerInfoSchema,
    createdDate: { type: Date },
    status: { type: String },
    items: [ItemSchema]
});
OrderSchema.method("toJSON", function () {
    const _a = this.toObject(), { __v, _id } = _a, object = __rest(_a, ["__v", "_id"]);
    object.id = _id;
    return object;
});
const OrderModel = db_1.mongoose.model('orders', OrderSchema);
exports.default = OrderModel;
