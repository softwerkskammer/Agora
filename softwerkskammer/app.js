"use strict";

const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const cookieParser = require("cookie-parser");
const favicon = require("serve-favicon");
const morgan = require("morgan");
const bodyparser = require("body-parser");
const compress = require("compression");
const csurf = require("csurf");

const winstonConfigPath = path.join(__dirname, "../config/winston-config.json");
// eslint-disable-next-line no-sync
if (fs.existsSync(winstonConfigPath)) {
  require("./initWinston")(winstonConfigPath);
}

function useApp(parent, url) {
  function ensureRequestedUrlEndsWithSlash(req, res, next) {
    if (!/\/$/.test(req.url)) {
      return res.redirect(req.url + "/");
    }
    next();
  }

  const child = require(`./lib/${url}`);
  if (child.get("env") !== "production") {
    child.locals.pretty = true;
  }
  parent.get("/" + url, ensureRequestedUrlEndsWithSlash);
  parent.use("/" + url + "/", child);
  return child;
}

const conf = require("simple-configure");

// initialize winston and two concrete loggers
const winston = require("winston");

const appLogger = winston.loggers.get("application");
const httpLogger = winston.loggers.get("http");

// stream the log messages of express to winston, remove line breaks on message
const winstonStream = {
  write: (message) => httpLogger.info(message.replace(/(\r\n|\n|\r)/gm, "")),
};

module.exports = {
  create: function create() {
    const app = express();
    app.set("view engine", "pug");
    app.set("views", path.join(__dirname, "views"));
    app.use(favicon(path.join(__dirname, "public/img/Softwerkskammer16x16.ico")));
    app.use(morgan("combined", { stream: winstonStream }));
    app.use(cookieParser());
    app.use(bodyparser.urlencoded({ extended: true }));
    app.use(compress());
    app.use(express.static(path.join(__dirname, "public"), { maxAge: 600 * 1000 })); // ten minutes
    app.use((req, res, next) => {
      res.locals.siteTitle = "SWK";
      res.locals.siteLogoPath = "/img/apple-touch-icon-152x152-precomposed.png";
      next();
    });

    app.use(require("./lib/middleware/expressSessionConfigurator"));
    app.use(require("./lib/middleware/passportInitializer"));
    app.use(require("./lib/middleware/passportSessionInitializer"));
    app.use(require("./lib/middleware/serverpathRemover"));
    app.use(require("./lib/middleware/accessrights"));
    app.use(require("./lib/middleware/secureByLogin"));
    app.use(require("./lib/middleware/secureSuperuserOnly"));
    app.use(require("./lib/middleware/expressViewHelper"));
    app.use(require("./lib/middleware/initI18N"));
    app.use(require("./lib/middleware/redirectRuleForNewUser"));
    app.use(require("./lib/middleware/wikiSubdirs"));
    app.use(require("./lib/middleware/secureAgainstClickjacking"));
    app.use(csurf());
    app.use(require("./lib/middleware/addCsrfTokenToLocals"));

    app.use("/", require("./lib/site"));
    useApp(app, "administration");
    useApp(app, "activities");
    useApp(app, "activityresults");
    useApp(app, "members");
    useApp(app, "groups");
    useApp(app, "mailsender");
    useApp(app, "auth");
    useApp(app, "wiki");
    useApp(app, "waitinglist");
    useApp(app, "dashboard");
    useApp(app, "gallery");

    app.use(require("./lib/middleware/handle404")());
    app.use(require("./lib/middleware/handle500")(appLogger));

    return app;
  },

  start: function start(done) {
    const port = conf.get("port");
    const app = this.create();

    this.server = http.createServer(app);
    this.server.listen(port, () => {
      appLogger.info("Server running at port " + port + " in " + process.env.NODE_ENV + " MODE");
      if (done) {
        done();
      }
    });
  },

  stop: function stop(done) {
    this.server.close(() => {
      appLogger.info("Server stopped");
      if (done) {
        done();
      }
    });
  },
};
