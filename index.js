var express = require('express'),
    http = require('http'),
    path = require('path'),
    lifegraph = require('lifegraph'),
    rem = require('rem');

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

// Crudely store user access tokens in a global hash for the duration of
// the Heroku app's life.
//
// In production, you would probably replace these with database-backed
// functions. As a convenience, these are written as asynchronous functions,
// though that's totally superfluous here.

var keys = {}
  , keyskey = 'im not actually a beggar, im actually a... magic man';

function hashUserId (id) {
  return require('crypto').createHmac('sha1', keyskey).update(id).digest('hex');
}

function storeCredentials (id, state, next) {
  keys[hashUserId(id)] = state;
  next(null);
}

function restoreCredentials (hash, next) {
  next(null, keys[hash]);
}

function clearStoredCredentials (id, next) {
  next(!(delete keys[hashUserId(id)]));
}

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

      storeCredentials(json.id, state, function () {
        res.redirect('/');
      });
    })
  });
}));

// connect lifegraph serial port
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

// Login route calls oauth.startSession, which redirects to an oauth URL.
app.get('/login/', oauth.login({
  scope: ['publish_stream']
}));

// Logout route clears the user's session.
// Use middleware to clear the tokens from our tokens store as well.
app.get('/logout/', function (req, res, next) {
  var user = oauth.session(req);
  if (!user) {
    return next();
  }

  user('me').get(function (err, json) {
    if (json && json.id) {
      clearStoredCredentials(json.id, next);
    } else {
      next();
    }
  })
}, oauth.logout(function (req, res) {
  res.redirect('/');
}));

app.get('/', function(req, res) {
  res.render('index.jade');
});


/**
 * Launch.
 */
 
server.listen(app.get('port'), function () {
  console.log("Express server listening http://" + app.get('host'));
});