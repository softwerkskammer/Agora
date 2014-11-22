'use strict';

module.exports = function redirectRuleForNewUser(req, res, next) {
  function proceed() {
    return (/\/registration\/newmember|\/auth\/logout|clientscripts|stylesheets|img|fonts|checknickname|checkemail/).test(req.originalUrl);
  }

  if (req.user && !req.user.member && !proceed()) {
    return res.redirect('/registration/newmember');
  }
  next();
};
