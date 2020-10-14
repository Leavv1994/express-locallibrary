var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser'); // provides a convenient method for accessing cookie informatio
var logger = require('morgan'); // An HTTP request logger middleware for node

// Import the mongoose module
var mongoose = require('mongoose'); 

//Set up default mongoose connection
var mongoDB = 'mongodb+srv://Leavv:hX8E@a&}yP2o$;wP7"5_`Q-*@leavvmongodb-asbfi.mongodb.net/LeavvMongoDB?retryWrites=true&w=majority';
mongoose.connect(mongoDB, { useNewUrlParser: true });

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var catalogRouter = require('./routes/catalog'); //Import routes for "catalog" area of site
var compression = require('compression');
var helmet = require('helmet');

var app = express(); // create the app object using our imported express module
//


// view engine setup
app.set('views', path.join(__dirname, 'views')); // value to specify the folder where the templates will be stored
app.set('view engine', 'pug'); // set value to specify the template library

app.use(helmet());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression()); //Compress all routes
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter); // Add catalog routes to middleware chain.


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
