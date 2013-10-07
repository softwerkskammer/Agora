"use strict";

var conf = require('nconf');
var winston = require('winston');
var logger = winston.loggers.get('authorization');
var adminURLRegex = new RegExp(conf.get('adminURLPattern'));

module.exports = function redirectIfNotAdmin(req, res, next) {
  var isAuthenticated = req.isAuthenticated && req.isAuthenticated();

  var userNeedsNotBeAdmin = false;
  if (isAuthenticated) {
    if (/members\/edit/.test(req.originalUrl)) {
      userNeedsNotBeAdmin = '/members/edit/' + encodeURIComponent(req.user.member.nickname) === req.originalUrl;
    }
    if (/members\/submit/.test(req.originalUrl)) {
      userNeedsNotBeAdmin = req.user.member ? (req.body.id === req.user.member.id) : true;
    }
    if (/members\/new/.test(req.originalUrl)) {
      userNeedsNotBeAdmin = !req.user.member;
    }
    if (/wiki/.test(req.originalUrl)) {
      userNeedsNotBeAdmin = true;
    }
  }

  if (adminURLRegex.test(req.originalUrl)) {
    if (!userNeedsNotBeAdmin && (!isAuthenticated || !req.user.member || !req.user.member.isAdmin)) {
      logger.info('Someone tried to access admin protected page.' + (req.user ? ' - User was: ' + req.user.identifier : ''));
      return res.redirect("/mustBeAdmin?page=" + encodeURIComponent(conf.get('publicUrlPrefix') + req.originalUrl));
    }
  }
  next();
};
