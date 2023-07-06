class CustomError {
code: string;
message: string;
    constructor(message) {
        this.code =  "ERR001";
        this.message = message;
    }
}

export default CustomError;