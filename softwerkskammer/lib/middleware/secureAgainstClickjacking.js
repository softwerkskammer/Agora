"use strict";
module.exports = function secureAgainstClickjacking(req, res, next) {
  res.setHeader("X-Frame-Options", "DENY");
  next();
};
