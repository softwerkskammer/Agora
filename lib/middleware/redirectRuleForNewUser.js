'use strict';

module.exports = function redirectRuleForNewUser(req, res, next) {
  function proceed() {
    return (/\/members\/new|\/members\/submit|\/auth\/logout|clientscripts|stylesheets|img|fonts|checknickname|checkemail/).test(req.originalUrl);
  }

  if (req.user && !req.user.member && !proceed()) {
    return res.redirect('/members/new');
  }
  next();
};
