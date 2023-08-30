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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_errors_1 = __importDefault(require("http-errors"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const db_1 = require("./config/db");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
dotenv_1.default.config();
// Connect to the database
(0, db_1.connectToDatabase)();
// Start the server
const port = process.env.PORT;
app.listen(port, () => {
    console.log("Server is successfully running on port " + port);
});
// view engine setup
app.set('views', path_1.default.join(__dirname, 'views'));
app.set('view engine', 'jade');
// Middleware
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
// image resource
const imagePath = path_1.default.join(__dirname, '../public/images');
app.use('/images', express_1.default.static(imagePath));
// API Routes
const bookRouter = require('./routes/books');
app.use('/api/books', bookRouter);
const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);
const cartsRouter = require('./routes/carts');
app.use('/api/carts', cartsRouter);
const ordersRouter = require('./routes/orders');
app.use('/api/orders', ordersRouter);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next((0, http_errors_1.default)(404));
});
// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.send('Internal Server Error');
});
// Gracefully disconnect from the database when the application is terminated
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, db_1.disconnectFromDatabase)();
    process.exit(0);
}));
module.exports = app;
