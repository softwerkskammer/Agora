"use strict";

const express = require("express");
const userStub = require("./userStub");

module.exports = function universalTestHelper(defaultLanguage) {
  return (internalAppName) => {
    const appName = internalAppName;

    return {
      createApp: (params) => {
        /* id, member, middlewares, baseurl, secureByMiddlewares, sessionID, sessionCaptureCallback */
        const atts = params || {};
        const app = express();
        app.locals.pretty = true;
        app.enable("view cache");
        app.use(require("cookie-parser")());
        app.use(require("body-parser").urlencoded({ extended: true }));
        app.use((req, res, next) => {
          res.locals.removeServerpaths = (msg) => msg;
          next();
        });
        app.use(require("../lib/middleware/expressSessionConfigurator"));

        if (atts.id) {
          const Member = require("../lib/members/member");
          app.use(userStub({ member: new Member({ id: atts.id }) }));
        }
        if (atts.member) {
          app.use(userStub({ member: atts.member }));
        }
        if (atts.user) {
          app.use(userStub(atts.user));
        }
        if (atts.sessionCaptureCallback) {
          app.use((req, res, next) => {
            atts.sessionCaptureCallback(req.session);
            next();
          });
        }
        app.use(require("../lib/middleware/accessrights"));
        (atts.secureByMiddlewares || []).forEach((middleware) => {
          app.use(middleware);
        });
        app.use((req, res, next) => {
          req.session.language = defaultLanguage;
          next();
        });
        if (atts.sessionID) {
          app.use((req, res, next) => {
            req.sessionID = atts.sessionID;
            next();
          });
        }

        app.use(require("../lib/middleware/expressViewHelper"));
        app.use(require("../lib/middleware/initI18N"));

        (atts.middlewares || []).forEach((middleware) => {
          app.use(middleware);
        });

        const baseurl = atts.baseurl || "/";
        app.use(baseurl, require(`../lib/${appName}`));

        const appLogger = { error: () => undefined };
        app.use(require("../lib/middleware/handle404")(appLogger));
        app.use(require("../lib/middleware/handle500")(appLogger));
        return app;
      },
    };
  };
};
