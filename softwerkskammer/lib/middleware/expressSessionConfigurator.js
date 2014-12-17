'use strict';
var conf = require('simple-configure');
var expressSession = require('express-session');
var sevenDays = 86400 * 1000 * 7;

var sessionStore;

if (!conf.get('dontUsePersistentSessions')) {
  var MongoStore = require('connect-mongostore')(expressSession);
  sessionStore = new MongoStore(conf.get('mongoURL'));
  sessionStore.options.stringify = true;
}

module.exports = expressSession({key: conf.get('sessionkey'),
  secret: conf.get('secret'), cookie: {maxAge: sevenDays}, store: sessionStore, resave: true, saveUninitialized: true});
