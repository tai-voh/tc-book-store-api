class Error {
    constructor(message) {
        this.code =  "ERR001";
        this.message = message;
    }
}

module.exports = Error;