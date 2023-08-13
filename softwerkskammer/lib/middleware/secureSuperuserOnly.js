const conf = require("simple-configure");
const logger = require("winston").loggers.get("authorization");
const securedBySuperuserURLRegex = new RegExp(conf.get("securedBySuperuserURLPattern"));

module.exports = function redirectIfNotSuperuser(req, res, next) {
  const originalUrl = req.originalUrl;
  const user = req.user;

  if (securedBySuperuserURLRegex.test(originalUrl)) {
    if (!res.locals.accessrights.isSuperuser()) {
      logger.info(
        `Someone tried to access superuser protected page ${originalUrl} ${
          user ? " - User was: " + user.authenticationId : ""
        }`,
      );
      return res.redirect(`/mustBeSuperuser?page=${encodeURIComponent(conf.get("publicUrlPrefix") + originalUrl)}`);
    }
  }
  next();
};
