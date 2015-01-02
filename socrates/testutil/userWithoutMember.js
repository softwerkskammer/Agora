'use strict';

module.exports = function userWithoutMember(req, res, next) {
  req.user = {};
  next();
};
