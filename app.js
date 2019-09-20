var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
const { Pool, Client } = require('pg')
var flash = require('connect-flash');

const fileUpload = require('express-fileupload');

var app = express();

// var pool = new Pool({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'pmsdb',
//   password: '123456',
//   port: 5432,
// })


var pool = new Pool({
  user: 'zxtbwzeeqwxgxh',
  host: 'ec2-174-129-227-128.compute-1.amazonaws.com',
  database: 'de4tgdd3mupq1m',
  password: 'd67daf43541e1daaa0719875b318590609a9c6c922a60f8087f837ff49ef4f5d',
  port: 5432,
})

var indexRouter = require('./routes/index')(pool);
var projectRouter = require('./routes/projects')(pool);
var profileRouter = require('./routes/profiles')(pool);
var usersRouter = require('./routes/users')(pool);
var membersRouter = require('./routes/members')(pool);

// var usersRouter = require('./routes/users');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use(session({
  secret: 'keyboard cat'
}))
app.use(flash());

app.use(fileUpload());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/profiles', profileRouter);
app.use('/projects', projectRouter);
app.use('/members', membersRouter);





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
