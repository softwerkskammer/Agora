"use strict";

var conf = require('nconf');
var api = conf.get('beans').get('announcementsAPI');
var _ = require('underscore');

module.exports = function latestNews(req, res, next) {
  api.allAnnouncementsUntilToday(function (err, news) {
    if (err) {return next(err); }
    var maxNewsInSidebar = 5;
    res.locals.latestNews = _.first(news, maxNewsInSidebar);
    res.locals.displayMoreNews = news.length > maxNewsInSidebar;
    next();
  });
};
