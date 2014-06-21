'use strict';
var conf = require('nconf');
var expressSession = require('express-session');
var sevenDays = 86400 * 1000 * 7;

var sessionStore;

if (!conf.get('dontUsePersistentSessions')) {
  var MongoStore = require('connect-mongo')(expressSession);
  sessionStore = new MongoStore({
    db: conf.get('mongoDB'),
    host: conf.get('mongoHost'),
    port: parseInt(conf.get('mongoPort'), 10),
    username: conf.get('mongoUser'),
    password: conf.get('mongoPass')
  });
}

module.exports = expressSession({key: 'softwerkskammer.org', secret: conf.get('secret'), cookie: {maxAge: sevenDays}, store: sessionStore});
