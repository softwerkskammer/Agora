'use strict';

var store = require('simple-configure').get('beans').get('announcementstore');
var _ = require('lodash');

module.exports = function latestNews(req, res, next) {
  store.allAnnouncementsUntilToday(function (err, news) {
    if (err) {return next(err); }
    var maxNewsInSidebar = 5;
    res.locals.latestNews = _.take(news, maxNewsInSidebar);
    res.locals.displayMoreNews = news.length > maxNewsInSidebar;
    next();
  });
};
