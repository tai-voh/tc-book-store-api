const createError = require('http-errors');
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const { connectToDatabase, disconnectFromDatabase } = require('./config/db');
const cors = require('cors');

const app = express();
app.use(cors())
dotenv.config();

// Connect to the database
connectToDatabase();

// Start the server
const port = process.env.PORT;
app.listen(port, (error) => {
  if (!error)
    console.log("Server is successfully running on port " + port)
  else
    console.log("Error occurred, server can't start", error);
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
const usersRouter = require('./routes/users');
app.use('/api/books', bookRouter);
app.use('/api/users', usersRouter)

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

// Gracefully disconnect from the database when the application is terminated
process.on('SIGINT', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});

module.exports = app;
