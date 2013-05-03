"use strict";

module.exports = function redirectRuleForNewUser(req, res, next) {
  var urlNew = '/members/new';
  var originalUrl = req.originalUrl;

  function isOK() {
    return originalUrl !== urlNew &&
      originalUrl !== '/members/submit' && //
      originalUrl !== '/auth/logout' && //
      !/.clientscripts./.test(originalUrl) && //
      !/.stylesheets./.test(originalUrl) && //
      !/.img./.test(originalUrl) && !/.checknickname./.test(originalUrl);
  }

  if (req.user && !req.user.member && isOK()) {
    return res.redirect(urlNew);
  }
  next();
};
