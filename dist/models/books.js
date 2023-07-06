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
const imagePath = '/src/public/images/';
const BookSchema = new Schema({
    title: { type: String },
    image: { type: String },
    quantity: { type: Number },
    price: { type: Number },
    description: { type: String },
    categoryId: { type: String },
    userId: { type: String }
});
BookSchema.method("toJSON", function () {
    const _a = this.toObject(), { __v, _id } = _a, object = __rest(_a, ["__v", "_id"]);
    object.id = _id;
    object.image = imagePath + object.image;
    return object;
});
const BookModel = db_1.mongoose.model('books', BookSchema);
exports.default = BookModel;
