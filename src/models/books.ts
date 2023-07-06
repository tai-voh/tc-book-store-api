import { mongoose } from '../config/db';
const Schema = mongoose.Schema;

const BookSchema = new Schema({
    title: { type: String },
    image: { type: String },
    quantity: { type: Number },
    price: { type: Number },
    description: { type: String },
    categoryId: {type: String},
    userId: { type: String}
});

BookSchema.index({ title: 'text', description: 'text'});

BookSchema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

const BookModel = mongoose.model('books', BookSchema);

export default BookModel;