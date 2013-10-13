"use strict";

module.exports = function (user) {

  var userMock = function (req, res, next) {
    req.user = user || {};
    next();
  };

  return userMock;
};

