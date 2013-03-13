var express = require('express'),
    http = require('http'),
    path = require('path'),
    lifegraph = require('lifegraph'),
    rem = require('rem'),
    socketio = require('socket.io'),
    FormData = require('form-data'), 
    fs = require('fs');

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

var delay_emit = {delay: false, message: "", signal: ""};
// The oauth middleware intercepts the callback url that we set when we
// created the oauth middleware.
var oauth = rem.oauth(fb, 'http://' + app.get('host') + '/oauth/callback/');
app.use(oauth.middleware(function (req, res, next) {
  console.log("User is now authenticated.");
  var user = oauth.session(req);
  user('me').get(function (err, json) {
    user.saveState(function (state) {
      if (err || !json.id) {
        res.redirect('/error');
      }

      // send off the picture to be saved by facebook
      // storeCredentials(json.id, state, function () {
      //   res.redirect('/');
      // });
      post_photo(user, function (json, err) {
        var msg; 
        if (!err) {
          msg = "Sucessfully sent photo to Facebook";
        } else {
          msg = "Error sending to Facebook: "+ err;
        }
        delay_emit.delay = true;
        delay_emit.message = {"message": msg};
        delay_emit.signal = "savedPhoto";
        res.redirect('/');
      });
    });
  });
}));

try {
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
} catch (e) {
  console.log("problem with lifegraph connect serial", e);
}


io.sockets.on('connection', function (socket) {
  mostRecentSocket = socket;
  if (delay_emit.delay) {
    delay_emit.delay = false;
    mostRecentSocket.emit(delay_emit.signal, delay_emit.message);
  }
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
  console.log("test");
  res.render('index.jade');
});

app.get('/login', function(req, res) {
  res.redirect('/');
});

app.get('/send_to_fb', oauth.login({
  // upload if they log in via the site
  scope: ['publish_stream']
}));

var datauri; 
app.post('/upload', function (req, res) {
  // upload if they've tapped in with a charlie card

  var user = rem.oauth(fb).restore(mostRecentTokens);
  // datauri = req.body.datauri;
  post_photo(user, function(json, err) {
    res.json(json);
  });
});

app.post('/save_photo', function(req, res) {

  datauri = req.body.datauri;
  var base64Data = datauri.replace(/^data:image\/png;base64,/,"");
  var buffer = new Buffer(base64Data, 'base64');
  fs.writeFileSync('photos/'+ Date.now() + '.png', buffer);
  res.json("saved");
});

function post_photo(user, next) {
  // console.log("datauri", datauri);
  var form = new FormData();
  form.append('message', getCaption());
  // console.log(datauri);
  var base64Data = datauri.replace(/^data:image\/png;base64,/,"");
  // console.log(base64Data);
  var b = new Buffer(base64Data, 'base64');
  b.path = "image.png";
  form.append('source', b);
  form.pipe(user('me/photos').post(form.getHeaders()['content-type'], function (err, json) {
    console.log('After upload:', err, json);
    next(json, err);
    mostRecentTokens = null; // clear the user
  }));
}

function getCaption() {
  var captions = ['I took a photo with Photobooth!',
                  'Picture evidence that I look awesome today.',
                  'Can you believe this?',
                  'I look so good.',
                  'Totally rocking it.',
                  'What do you think?',
                  'I won best looking!',
                  'I didn\'t even break the camera.',
                  'I should take a picture every day.',
                  'You would not believe the insanity.',
                  'Thinking of you and making this face.',
                  'Did you get your photo taken today?',
                  'Pics: Therefore, it happened.',
                  'Golly, I love http://lifegraphlabs.com'];
  return captions[Math.floor(Math.random() * captions.length)];
}

/**
 * Launch.
 */
 
server.listen(app.get('port'), function () {
  console.log("Express server listening http://" + app.get('host'));
});