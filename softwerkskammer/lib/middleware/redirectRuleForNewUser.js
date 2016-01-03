'use strict';

module.exports = function redirectRuleForNewUser(req, res, next) {
  function proceed() {
    return (/\/members\/new|\/members\/submit|\/auth\/idp|\/auth\/openid\/callback|\/auth\/github\/callback|\/auth\/googleplus\/callback|\/auth\/logout|clientscripts|stylesheets|img|fonts|checknickname|checkemail/).test(req.originalUrl);
  }

  if (!req.user || proceed()) {
    return next();
  }
  var member = req.user.member;

  if (!member) {
    return res.redirect('/members/new');
  }

  if (member.socratesOnly() && !/\/members\/edit/.test(req.originalUrl)) {
    return res.redirect('/members/edit/' + encodeURIComponent(member.nickname()));
  }
  next();
};
