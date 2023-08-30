import { mongoose } from '../config/db';

const Schema = mongoose.Schema;

const ItemSchema = new Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "books" },
    quantity: {type: Number},
    price: {type: Number},
    stockQuantity: {type: Number},
    title: {type: String}
});

const CartSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users"},
    items: [ ItemSchema ]
});

CartSchema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

const CartModel = mongoose.model('carts', CartSchema);

export default CartModel;