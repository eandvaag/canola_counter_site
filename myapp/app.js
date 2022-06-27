var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
var session = require('express-session');
var favicon = require('serve-favicon');

var indexRouter = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//app.use('/plant_detection/osd', express.static(__dirname + '/node_modules/openseadragon/build/openseadragon'));
app.use('/plant_detection/osd', express.static(__dirname + '/external_node_modules/openseadragon3'));
app.use('/plant_detection/annotorious', express.static(__dirname + '/external_node_modules/annotorious'));

//app.use('/plant_detection/public/images/favicon.ico', 
//        favicon(__dirname + '/public/images/favicon.ico'));
//app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

//app.use(favicon(__dirname + '/public/images/favicon.ico'));        

app.use(logger('dev'));
//app.use(express.json());
//app.use(express.urlencoded({ extended: false }));

app.use(bodyParser.json({limit: '30gb'}));
app.use(bodyParser.urlencoded({limit: '30gb', extended: true}));
app.use(express.json());

//app.use(express.json({ limit: "50000kb" }));
app.use(cookieParser());
app.use('/plant_detection', express.static(path.join(__dirname, 'public')));
app.use('/plant_detection/usr', express.static(path.join(__dirname, 'usr')));
app.use(session({
  key: 'user_sid',
  secret: 'secretcodeword',
  resave: true,
  saveUninitialized: true,
  cookie: {
    //expires: 6000000
  }
}));

app.use('/plant_detection', indexRouter);
app.use((req, res, next) => {
  if (req.cookies.user_sid && !req.session.user) {
    res.clearCookie('user_sid');
  }
  next();
})


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
