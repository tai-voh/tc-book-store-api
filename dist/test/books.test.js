"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const chai_1 = __importDefault(require("chai"));
const chai_http_1 = __importDefault(require("chai-http"));
const mongoose_1 = __importDefault(require("mongoose"));
// import { expect } from "chai";
const app = require('../app.ts');
chai_1.default.use(chai_http_1.default);
const expect = chai_1.default.expect;
describe('Test Books APIs', () => {
    let createdBookId;
    before((done) => {
        // Connect to the MongoDB test database
        mongoose_1.default.connect('mongodb://127.0.0.1:27017/book_store_db', { useNewUrlParser: true, useUnifiedTopology: true })
            .then(() => done())
            .catch((err) => done(err));
    });
    after((done) => {
        // Disconnect from the MongoDB test database
        mongoose_1.default.disconnect()
            .then(() => done())
            .catch((err) => done(err));
    });
    it('should get book list', (done) => {
        chai_1.default
            .request(app)
            .get('/api/books')
            .end((err, res) => {
            if (err)
                throw err;
            expect(res).to.has.status(200);
            done();
        });
    });
    it('should create a book', (done) => {
        const testBook = {
            title: "test",
            imageUrl: "http://dummyimage.com/210x100.png/cc0000/ffffff",
            quantity: 12,
            price: 44.02,
            description: "felis fusce posuere felis sed lacus morbi sem mauris laoreet ut rhoncus aliquet pulvinar sed nisl nunc rhoncus dui"
        };
        chai_1.default
            .request(app)
            .post('/api/books')
            .send(testBook)
            .end((err, res) => {
            if (err)
                throw err;
            createdBookId = res.body.id;
            expect(res).to.has.status(201);
            expect(res.body).to.be.an('object');
            done();
        });
    });
    it('should update a book', (done) => {
        chai_1.default
            .request(app)
            .put(`/api/books/${createdBookId}`)
            .end((err, res) => {
            if (err)
                throw err;
            expect(res).to.has.status(200);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.property('message', 'Book was updated successfully.');
            done();
        });
    });
    it('should get book by id', (done) => {
        chai_1.default
            .request(app)
            .get(`/api/books/${createdBookId}`)
            .end((err, res) => {
            if (err)
                throw err;
            expect(res).to.has.status(200);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.property('title', 'test');
            done();
        });
    });
    it('should delete a book', (done) => {
        chai_1.default
            .request(app)
            .delete(`/api/books/${createdBookId}`)
            .end((err, res) => {
            if (err)
                throw err;
            expect(res).to.has.status(204);
            done();
        });
    });
});
