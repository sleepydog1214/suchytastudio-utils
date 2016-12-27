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
 * routes/index.js
 *
 * Functions to render all site pages and send data to views/*.jade
 * files.
 *
 * loggedIn() - Check if a user is logged in.
 * loggedInUser() - Find logged in user name.
 * drawHomePage() - Grab one random original image and one edit image
 *                  for the home page.
 * GET / - Render home page.
 * GET index - Render home page.
 * GET util - Utilities page.
 * GET about - About Us page.
 * GET photos - Original photos edit page.
 * GET art - Edited photos page.
 * GET login - User login page.
 * POST login - Handle user login.
 * GET login/failure - Handle user login failure.
 * POST logout - Handle user logout.
 ********************************************************************/
var express  = require('express');
var router   = express.Router();
var passport = require('passport');

/*********************************************************************
 * loggedIn() - Check if a user is logged in.
 ********************************************************************/
var loggedIn = function (req, res, next) {
  if (req.user) {
      next();
  } else {
      res.redirect('/login');
  }
};

/*********************************************************************
 * loggedInUser() - Find logged in user name.
 ********************************************************************/
var loggedInUser = function(req) {
  if (req.user) {
    return 'user: ' + req.user.username;
  }
  else {
    return '';
  }
};

/*********************************************************************
 * drawHomePage() - Grab one random original image and one edit image
 *                  for the home page.
 ********************************************************************/
function drawHomePage(req, res) {
  var db = req.db;
  var collection = db.get('pageContent');

  var data = collection.find({}, {}, function(e, docs) {
    var homeIntro = docs[0].homeIntro;
    var homeTitle = docs[0].homeTitle;
    var usrname = loggedInUser(req);

    if (usrname) {
      res.render('index', { title: homeTitle,
                            intro: homeIntro,
                            pagename: 'index',
                            loginsite: 'Logout',
                            username: usrname });
    }
    else {
      res.render('index', { title: homeTitle,
                            intro: homeIntro,
                            pagename: 'index',
                            loginsite: 'Login',
                            username: usrname });
    }
  });
};

/*********************************************************************
 * GET / - Render home page.
 ********************************************************************/
router.get('/', function(req, res, next) {
  drawHomePage(req, res);
});

/*********************************************************************
 * GET index - Render home page.
 ********************************************************************/
router.get('/index', function(req, res, next) {
  drawHomePage(req, res);
});

/*********************************************************************
 * GET util - Utilities page.
 ********************************************************************/
router.get('/util', loggedIn, function(req, res) {
  var db = req.db;
  var collection = db.get('pageContent');

  var data = collection.find({}, {}, function(e, docs) {
    var usrname = loggedInUser(req);
    var utilTitle = docs[0].utilTitle;

    if (usrname) {
      res.render('util', { title: utilTitle,
                           pagename: 'util',
                           loginsite: 'Logout',
                           username: usrname });
    }
    else {
      res.render('util', { title: utilTitle,
                           pagename: 'util',
                           loginsite: 'Login',
                           username: usrname });
    }
  });
});

/*********************************************************************
 * GET about - About Us page.
 ********************************************************************/
router.get('/about', function(req, res) {
  var db = req.db;
  var collection = db.get('pageContent');

  var data = collection.find({}, {}, function(e, docs) {
    var usrname = loggedInUser(req);
    var aboutTitle = docs[0].aboutTitle;
    var aboutIntro = docs[0].aboutIntro;
    var aboutParagraph = docs[0].aboutParagraph;

    if (usrname) {
      res.render('about', { title: aboutTitle,
                            intro: aboutIntro,
                            about: aboutParagraph,
                            pagename: 'about',
                            loginsite: 'Logout',
                            username: usrname });
    }
    else {
      res.render('about', { title: aboutTitle,
                            intro: aboutIntro,
                            about: aboutParagraph,
                            pagename: 'about',
                            loginsite: 'Login',
                            username: usrname });
    }
  });
});

/*********************************************************************
 * GET photos - Original photos edit page.
 ********************************************************************/
router.get('/photos', loggedIn, function(req, res) {
  var db = req.db;
  var collection = db.get('pageContent');

  var data = collection.find({}, {}, function(e, docs) {
    var usrname = loggedInUser(req);
    var photosTitle = docs[0].photosTitle;

    if (usrname) {
      res.render('photos', { title: photosTitle,
                             pagename: 'photos',
                             loginsite: 'Logout',
                             username: usrname });
    }
    else {
      res.render('photos', { title: photosTitle,
                             pagename: 'photos',
                             loginsite: 'Login',
                             username: usrname });
    }
  });
});

/*********************************************************************
 * GET art - Edited photos page.
 ********************************************************************/
router.get('/art', function(req, res) {
  var db = req.db;
  var collection = db.get('pageContent');

  var data = collection.find({}, {}, function(e, docs) {
    var usrname = loggedInUser(req);
    var artTitle = docs[0].artTitle;

    if (usrname) {
      res.render('art', { title: artTitle,
                          pagename: 'art',
                          loginsite: 'Logout',
                          username: usrname });
    }
    else {
      res.render('art', { title: artTitle,
                          pagename: 'art',
                          loginsite: 'Login',
                          username: usrname });
    }
  });
});

/*********************************************************************
 * GET login - User login page.
 ********************************************************************/
router.get('/login', function(req, res) {
  var db = req.db;
  var collection = db.get('pageContent');

  var data = collection.find({}, {}, function(e, docs) {
    var usrname = loggedInUser(req);
    var loginTitle = docs[0].loginTitle;
    var logoutTitle = docs[0].logoutTitle;

    if (usrname) {
      res.render('login', { title: logoutTitle,
                            pagename: 'login',
                            loginsite: 'Logout',
                            username: usrname });
    }
    else {
      res.render('login', { title: loginTitle,
                            pagename: 'login',
                            loginsite: 'Login',
                            username: usrname });
    }
  });
});

/*********************************************************************
 * POST login - Handle user login.
 ********************************************************************/
router.post('/login',
  passport.authenticate('local', { successRedirect: '/index',
                                   failureRedirect: '/login/failure' })
);

/*********************************************************************
 * GET login/failure - Handle user login failure.
 ********************************************************************/
router.get('/login/failure', function(req, res) {
  res.render('login', { title: 'Retry Login', message: 'Invalid email or password'});
});

/*********************************************************************
 * POST logout - Handle user logout.
 ********************************************************************/
router.post('/logout', function(req, res) {
  req.logout();
  res.redirect('/login');
});

module.exports = router;
