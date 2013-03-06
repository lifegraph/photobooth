var express = require('express'),
    http = require('http'),
    path = require('path');

/**
 * App configuration.
 */

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
  app.set('fbapp', 'lifegraph-local');
  app.use(express.logger('dev'));
  app.use(express.errorHandler());
});

app.configure('production', function () {
  app.set('fbapp', 'lifegraph');
  app.set('host', 'connect.lifegraphlabs.com')
})

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