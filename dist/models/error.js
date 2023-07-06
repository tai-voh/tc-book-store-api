"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CustomError {
    constructor(message) {
        this.code = "ERR001";
        this.message = message;
    }
}
exports.default = CustomError;
