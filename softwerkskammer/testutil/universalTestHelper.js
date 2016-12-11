'use strict';

const express = require('express');
const userStub = require('./userStub');

module.exports = function universalTestHelper(defaultLanguage) {
  return (internalAppName, configuredBeans) => {
    const appName = internalAppName;
    const beans = configuredBeans || require('./configureForTest').get('beans');
    const initI18N = beans.get('initI18N');

    return {
      createApp: params => { /* id, member, middlewares, baseurl, secureByMiddlewares, sessionID */
        const atts = params || {};
        const app = express();
        app.locals.pretty = true;
        app.enable('view cache');
        app.use(require('cookie-parser')());
        app.use(require('body-parser').urlencoded({extended: true}));
        app.use((req, res, next) => {
          res.locals.removeServerpaths = msg => msg;
          next();
        });
        app.use(beans.get('expressSessionConfigurator'));

        if (atts.id) {
          const Member = beans.get('member');
          app.use(userStub({member: new Member({id: atts.id})}));
        }
        if (atts.member) {
          app.use(userStub({member: atts.member}));
        }
        if (atts.user) {
          app.use(userStub(atts.user));
        }
        app.use(beans.get('accessrights'));
        (atts.secureByMiddlewares || []).forEach(middleware => {
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

        app.use(beans.get('expressViewHelper'));
        app.use(initI18N);

        (atts.middlewares || []).forEach(middleware => {
          app.use(middleware);
        });

        const baseurl = atts.baseurl || '/';
        app.use(baseurl, beans.get(appName));

        const appLogger = {error: () => undefined};
        app.use(beans.get('handle404')(appLogger));
        app.use(beans.get('handle500')(appLogger));
        return app;
      }
    };
  };
};
