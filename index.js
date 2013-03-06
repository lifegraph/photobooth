var express = require('express'),
    http = require('http'),
    path = require('path'),
    lifegraph = require('lifegraph');

var lifegraph_serial = require('./controllers/lifegraph_serial');

/**
 * App configuration.
 */

// where the arduino is
var arduino_port = "/dev/tty.usbmodemfd121";

var app = express();
var server = http.createServer(app);

app.configure(function () {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.cookieSession({
    secret: 'PAUL "photo" BOOTH'
  }));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use('/', express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
  app.set('host', 'localhost:' + app.get('port'));
  app.use(express.logger('dev'));
  app.use(express.errorHandler());
});

lifegraph_serial.setPidCallback(arduino_port, function(pid) {
  lifegraph.connect(pid, function (error, facebookUser) {

    // There was an error (like the device hasn't been synced yet)
    if (error) {

    } else {

    }
  });
});

/**
 * Routes
 */

app.get('/', function(req, res) {
  res.render('index.jade');
});

/**
 * Launch.
 */
 
server.listen(app.get('port'), function () {
  console.log("Express server listening http://" + app.get('host'));
});