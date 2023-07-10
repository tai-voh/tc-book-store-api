import express from 'express';
import dotenv from 'dotenv';
import createError from 'http-errors';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { connectToDatabase, disconnectFromDatabase } from './config/db';
import cors from 'cors';


const app = express();
app.use(cors())
dotenv.config();

// Connect to the database
connectToDatabase();

// Start the server
const port = process.env.PORT;
app.listen(port, () => {
    console.log("Server is successfully running on port " + port)  
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

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
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.send('Internal Server Error');
});

// image resource
const imagePath = path.join(__dirname, '..', 'public/images');
app.use('/images', express.static(imagePath));

// Gracefully disconnect from the database when the application is terminated
process.on('SIGINT', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});

module.exports = app;
