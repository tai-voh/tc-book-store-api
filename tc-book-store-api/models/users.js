const { mongoose } = require('../config/db');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    password: { type: String },
    admin: {type: Boolean},
    token: { type: String },
});

UserSchema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

const UserModel = mongoose.model('users', UserSchema);

module.exports = UserModel;