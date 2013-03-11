var express = require('express'),
    http = require('http'),
    path = require('path'),
    lifegraph = require('lifegraph'),
    rem = require('rem'),
    socketio = require('socket.io'),
    FormData = require('form-data');

var lifegraph_serial = require('./controllers/lifegraph_serial');

/**
 * App configuration.
 */

var app = express();
var server = http.createServer(app);

var io = socketio.listen(server);
var mostRecentSocket = null, // we only want one socket max.
    mostRecentTokens = null;

app.configure(function () {
  app.set('port', process.env.PORT || 3000);
  app.set('host', process.env.HOST || ('localhost:' + app.get('port')));
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

var fb = rem.connect('facebook.com', '1.0').configure({
  key: process.env.FB_KEY,
  secret: process.env.FB_SECRET
});

lifegraph.configure(process.env.FB_NAMESPACE, process.env.FB_KEY, process.env.FB_SECRET);

// connect lifegraph serial port
lifegraph_serial.setPidCallback( function(pid) {
  lifegraph.connect(pid, function (error, user) {

    // There was an error (like the device hasn't been synced yet)
    if (error) {
      if (error == 404) { // not bound
        return console.log({'error': "Physical ID has not been bound to an account. Go to http://connect.lifegraphlabs.com/, Connect with Music Player App, and tap again."});
      } else if (error == 406) { // no tokens, no access
        return console.log({'error': "No tokens found. User may have revoked access."});
      }
    } else { // all good. we have a facebook user
      if (mostRecentSocket) {
        mostRecentTokens = user.tokens;
        mostRecentSocket.emit('startPhoto');
      }
    }
  });
});

io.sockets.on('connection', function (socket) {
  mostRecentSocket = socket;
  socket.on('disconnect', function () {
    if (mostRecentSocket == socket) {
      mostRecentTokens = null;
      mostRecentSocket = null;
    }
  });
});

/**
 * Routes
 */

app.get('/', function(req, res) {
  res.render('index.jade');
});

app.post('/upload', function (req, res) {
  if (!mostRecentTokens) {
    return res.json({error: "Not logged in."});
  }

  var user = rem.oauth(fb).restore(mostRecentTokens);

  var datauri = req.body.datauri;
  // console.log("datauri", datauri);
  var form = new FormData();
  form.append('message', 'I took a photo with Photobooth!');
  // console.log(datauri);
  var base64Data = datauri.replace(/^data:image\/png;base64,/,"");
  // console.log(base64Data);
  var b = new Buffer(base64Data, 'base64');
  b.path = "image.png";
  form.append('source', b);
  form.pipe(user('me/photos').post(form.getHeaders()['content-type'], function (err, json) {
    console.log('After upload:', err, json);
    res.json(json);
    mostRecentTokens = null; // clear the user
  }));
});


/**
 * Launch.
 */
 
server.listen(app.get('port'), function () {
  console.log("Express server listening http://" + app.get('host'));
});