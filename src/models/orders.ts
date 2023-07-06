import { mongoose } from '../config/db';

const Schema = mongoose.Schema;

const ItemSchema = new Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "BookModel" },
    quantity: { type: Number },
    price: { type: Number },
    title: { type: String }
});

const CustomerInfoSchema = new Schema({
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    tel: { type: String },
    address: {type: String }
})

const OrderSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel"},
    customerInfo: CustomerInfoSchema,
    createdDate: {type: Date},
    status: { type: String },
    items: [ ItemSchema ]
});

OrderSchema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

const OrderModel = mongoose.model('orders', OrderSchema);

export default OrderModel;