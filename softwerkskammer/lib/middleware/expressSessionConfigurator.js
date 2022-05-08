const conf = require("simple-configure");
const expressSession = require("express-session");
const sevenDays = 86400 * 1000 * 7;
const oneHour = 3600;

let sessionStore;

if (!conf.get("dontUsePersistentSessions")) {
  const MongoStore = require("connect-mongo");
  sessionStore = MongoStore.create({
    mongoUrl: conf.get("mongoURL"),
    touchAfter: oneHour,
    mongoOptions: { useNewUrlParser: true, useUnifiedTopology: true },
  });
}

module.exports = expressSession({
  key: conf.get("sessionkey"),
  secret: conf.get("secret"),
  cookie: { maxAge: sevenDays },
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
});
