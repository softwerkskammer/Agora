const conf = require("simple-configure");
const expressSession = require("express-session");
const sevenDays = 86400 * 1000 * 7;
const oneHour = 3600 * 1000;

const sqlitedb = conf.get("sqlitedb");
const Sqlite = require("better-sqlite3");
const path = require("node:path");
const SqliteStore = require("better-sqlite3-session-store")(expressSession);
const db = new Sqlite(path.join(__dirname, sqlitedb, "../sessions.db"));

let sessionStore;

if (!conf.get("dontUsePersistentSessions")) {
  sessionStore = new SqliteStore({
    client: db,
    expired: {
      clear: true,
      intervalMs: oneHour,
    },
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

/*
const session = require("express-session")

const sqlite = require("better-sqlite3");
const SqliteStore = require("better-sqlite3-session-store")(session)
const db = new sqlite("sessions.db", { verbose: console.log });

app.use(
  session({
    store: new SqliteStore({
      client: db,
      expired: {
        clear: true,
        intervalMs: 900000 //ms = 15min
      }
    }),
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
  })
)

 */
