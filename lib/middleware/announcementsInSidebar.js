"use strict";

var conf = require('nconf');
var api = conf.get('beans').get('announcementsAPI');
var _ = require('underscore');

module.exports = function latestNews(req, res, next) {
  api.allAnnouncementsUntilToday(function (err, news) {
    if (err) {return next(err); }
    res.locals.latestNews = _.first(news, 5);
    next();
  });
};
