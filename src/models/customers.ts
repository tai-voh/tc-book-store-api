import { mongoose } from '../config/db';

const Schema = mongoose.Schema;

const CustomerInfoSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users"},
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    tel: { type: String },
    address: {type: String }
})

CustomerInfoSchema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

const CustomerModel = mongoose.model('customers', CustomerInfoSchema);

export default CustomerModel;