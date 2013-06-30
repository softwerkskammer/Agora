"use strict";

module.exports = function latestNews(req, res, next) {
  res.locals.latestNews = [];
  next();
};
