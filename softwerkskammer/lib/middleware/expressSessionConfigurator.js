'use strict';
var conf = require('simple-configure');
var expressSession = require('express-session');
var sevenDays = 86400 * 1000 * 7;
var oneHour = 3600;

var sessionStore;

if (!conf.get('dontUsePersistentSessions')) {
  var MongoStore = require('connect-mongo')(expressSession);
  sessionStore = new MongoStore({
    url: conf.get('mongoURL'),
    touchAfter: oneHour
  });
}

module.exports = expressSession({
  key: conf.get('sessionkey'),
  secret: conf.get('secret'),
  cookie: {maxAge: sevenDays},
  store: sessionStore,
  resave: false,
  saveUninitialized: false
});
