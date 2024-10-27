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

function useApp(parent, url, child) {
  function ensureRequestedUrlEndsWithSlash(req, res, next) {
    if (!/\/$/.test(req.url)) {
      return res.redirect(req.url + "/");
    }
    next();
  }

  if (child.get("env") !== "production") {
    child.locals.pretty = true;
  }
  parent.get("/" + url, ensureRequestedUrlEndsWithSlash);
  parent.use("/" + url + "/", child);
  return child;
}

const conf = require("simple-configure");
const beans = conf.get("beans");

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

    app.use(beans.get("expressSessionConfigurator"));
    app.use(beans.get("passportInitializer"));
    app.use(beans.get("passportSessionInitializer"));
    app.use(beans.get("serverpathRemover"));
    app.use(beans.get("accessrights"));
    app.use(beans.get("secureByLogin"));
    app.use(beans.get("secureSuperuserOnly"));
    app.use(beans.get("expressViewHelper"));
    app.use(beans.get("initI18N"));
    app.use(beans.get("redirectRuleForNewUser"));
    app.use(beans.get("wikiSubdirs"));
    app.use(beans.get("detectBrowser"));
    app.use(beans.get("secureAgainstClickjacking"));
    app.use(csurf());
    app.use(beans.get("addCsrfTokenToLocals"));

    app.use("/", beans.get("siteApp"));
    useApp(app, "administration", beans.get("administrationApp"));
    useApp(app, "activities", beans.get("activitiesApp"));
    useApp(app, "activityresults", beans.get("activityresultsApp"));
    useApp(app, "members", beans.get("membersApp"));
    useApp(app, "groups", beans.get("groupsApp"));
    useApp(app, "mailsender", beans.get("mailsenderApp"));
    useApp(app, "auth", beans.get("authenticationApp"));
    useApp(app, "wiki", beans.get("wikiApp"));
    useApp(app, "waitinglist", beans.get("waitinglistApp"));
    useApp(app, "dashboard", beans.get("dashboardApp"));
    useApp(app, "gallery", beans.get("galleryApp"));

    app.use(beans.get("handle404")());
    app.use(beans.get("handle500")(appLogger));

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
