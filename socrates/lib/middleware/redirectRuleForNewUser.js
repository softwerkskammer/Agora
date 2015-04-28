'use strict';

module.exports = function redirectRuleForNewUser(req, res, next) {
  function proceed() {
    return (/\/registration\/completeRegistration|\/registration\/participate|\/members\/edit|\/members\/submit|\/subscribers\/count|\/auth\/logout|clientscripts|stylesheets|img|fonts|checknickname|checkemail/).test(req.originalUrl);
  }

  if (req.user && !req.user.member && !proceed()) {
    return res.redirect('/members/edit');
  }
  next();
};
