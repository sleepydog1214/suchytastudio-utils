#!/bin/env node

/*********************************************************************
The MIT License (MIT)

Copyright (c) 2016 Thomas Suchyta

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 ********************************************************************/

/*********************************************************************
 * ./server.js
 *
 * Functions to start the node.js server
 * for the Suchyta Studio utilities application.
 *
 * getMongodbConnectionString() - Get the mongodb connection string.
 * findByUserEmail() - Find the user by submitted email.
 * findByUserId() - find User by DB id.
 * SuchytaStudioApp() - Define the Suchyta Studio utiity application.
 ********************************************************************/

var express       = require('express');
var fs            = require('fs');
var path          = require('path');
var favicon       = require('serve-favicon');
var logger        = require('morgan');
var session       = require('express-session');
var MongoStore    = require('connect-mongo')(session);
var bodyParser    = require('body-parser');
var routes        = require('./routes/index');
var users         = require('./routes/users');
var images        = require('./routes/images');

var mongo         = require('mongodb');
var monk          = require('monk');

var password      = require('password-hash-and-salt');

var passport      = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var dotenv        = require('dotenv').load();

/*********************************************************************
 * getMongodbConnectionString() - Get the mongodb connection string
 ********************************************************************/
var getMongodbConnectionString = function () {
  // db name
  var db_name = 'suchytastudio';

  //provide a sensible default for local development
  var mongodb_connection_string = 'mongodb://127.0.0.1:27017/' + db_name;

  //take advantage of heroku env vars when available:
  if(process.env.MONGODB_URI){
    mongodb_connection_string = process.env.MONGODB_URI;
  }
  return mongodb_connection_string;
}

/*********************************************************************
 * Global mongoDB and monk variable
 ********************************************************************/
var db = monk(getMongodbConnectionString());

/*********************************************************************
 * Setup the passport local strategy
 ********************************************************************/
passport.use(new LocalStrategy({usernameField: 'email'},
  function(email, password, cb) {
    findByUserEmail(email, password, function(err, user) {
      if (err) {
        return cb(err);
      }
      // Email not found or incorrect password
      if (!user) {
        return cb(null, false, { message: 'Invalid login'});
      }
      else {
        return cb(null, user);
      }
    });
}));

/*********************************************************************
 * findByUserEmail() - Find the user by submitted email.
 ********************************************************************/
var findByUserEmail = function(email, loginPwd, cb) {
  var collection = db.get('userList');
  collection.findOne({ 'email' : email }, { '_id': 1, 'password': 1 },
    function(err, docs) {
      if (err) {
        return cb(err, null);
      }
      // If email is not found
      if (!docs) {
        return cb(null, false);
      }

      password(loginPwd).verifyAgainst(docs.password,
        function(error, verified) {
          if(error) {
            return cb(error, null);
          }
          // If passwords do not match
          if(!verified) {
            return cb(null, false);
          }
          // Else matched passwords
          else {
            return cb(null, docs);
          }
      });
  });
};

/*********************************************************************
 * findByUserId() - find User by DB id.
 ********************************************************************/
var findByUserId = function(id, cb) {
  var collection = db.get('userList');
  collection.findOne({ '_id' : id }, { '_id': 1, 'password': 1 },
    function(err, docs) {
      if (err) {
        return cb(err, null);
      }
      // If id is not found
      if (!docs) {
        return cb(null, false);
      }
      else {
        return cb(null, docs);
      }
  });
};

/*********************************************************************
 * Serialize each user
 ********************************************************************/
passport.serializeUser(function(user, cb) {
  cb(null, user._id);
});

/*********************************************************************
 * Deserialize each user
 ********************************************************************/
passport.deserializeUser(function(id, cb) {
  findByUserId(id, function (err, user) {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

/*********************************************************************
 *  SuchytaStudioApp() - Define the Suchyta Studio Utilities application.
 ********************************************************************/
var SuchytaStudioApp = function() {
  //  Scope.
  var self = this;

  // Helper functions.

  // Set up server IP address and port # using env variables/defaults.
  self.setupVariables = function() {

    //  Set the environment variables we need.
    self.port = process.env.PORT || 8081;
  };

  // Terminate server on receipt of the specified signal.
  self.terminator = function(sig){
    if (typeof sig === "string") {
       console.log('%s: Received %s - terminating suchyta studio app ...',
                   Date(Date.now()), sig);
       process.exit(1);
    }
    console.log('%s: Node server stopped.', Date(Date.now()) );
  };

  // Setup termination handlers (for exit and a list of signals).
  self.setupTerminationHandlers = function(){
    //  Process on exit and signals.
    process.on('exit', function() { self.terminator(); });

    // Removed 'SIGPIPE' from the list - bugz 852598.
    ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
     'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
    ].forEach(function(element, index, array) {
        process.on(element, function() { self.terminator(element); });
    });
  };

  // App server functions (main app logic here)

  // Initialize the server (express) and create the routes and register
  // the handlers.
  self.initializeServer = function() {
    self.app = express();

    // view engine setup
    self.app.set('views', path.join(__dirname, 'views'));
    self.app.set('view engine', 'pug');

    // uncomment after placing your favicon in /public
    //self.app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
    self.app.use(logger('dev'));
    self.app.use(bodyParser.json());
    self.app.use(bodyParser.urlencoded({ extended: false }));
    self.app.use(express.static(path.join(__dirname, 'public')));
    self.app.use(session({ secret: 'suchyta studio util',
                           key: 'sid',
                           resave: true,
                           saveUninitialized: true,
                           store: new MongoStore({ url: getMongodbConnectionString() }),
                           cookie: { maxAge: 7200000 }}));

    // Make our db accessible to our router
    self.app.use(function(req, res, next){
        req.db = db;
        next();
    });

    self.app.use(passport.initialize());
    self.app.use(passport.session());

    self.app.use('/', routes);
    self.app.use('/users', users);
    self.app.use('/images', images);

    // catch 404 and forward to error handler
    self.app.use(function(req, res, next) {
      var err = new Error('Not Found');
      err.status = 404;
      next(err);
    });

    // error handlers

    // development error handler
    // will print stacktrace
    if (self.app.get('env') === 'development') {
      self.app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
          message: err.message,
          error: err
        });
      });
    }

    // production error handler
    // no stacktraces leaked to user
    self.app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: {}
      });
    });
  };

  // Initializes the suchyta studio application.
  self.initialize = function() {
    self.setupVariables();
    self.setupTerminationHandlers();

    // Create the express server and routes.
    self.initializeServer();
  };

  // Start the server (starts up the suchyta studio application).
  self.start = function() {
    //  Start the app on the specific interface (and port).
    self.app.listen(self.port, function() {
        console.log('%s: Node server started on port: %d ...',
                    Date(Date.now() ), self.port);
    });
  };
};

/*********************************************************************
 *  Main code - start the Suchyta Studio Utilities App
 ********************************************************************/
var zapp = new SuchytaStudioApp();
zapp.initialize();
zapp.start();
