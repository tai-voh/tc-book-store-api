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
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectFromDatabase = exports.connectToDatabase = exports.mongoose = void 0;
const mongoose = require('mongoose');
exports.mongoose = mongoose;
function connectToDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose.connect(process.env.DB_CONNECTION_STRING, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log('Connected to the database');
        }
        catch (error) {
            console.error('Error connecting to the database:', error);
            // Handle the error appropriately (e.g., exit the application, retry connection, etc.)
        }
    });
}
exports.connectToDatabase = connectToDatabase;
function disconnectFromDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose.disconnect();
            console.log('Disconnected from the database');
        }
        catch (error) {
            console.error('Error disconnecting from the database:', error);
        }
    });
}
exports.disconnectFromDatabase = disconnectFromDatabase;
