"use strict";

var conf = require('nconf');
var winston = require('winston');
var logger = winston.loggers.get('authorization');
var adminURLRegex = new RegExp(conf.get('adminURLPattern'));

module.exports = function redirectIfNotAdmin(req, res, next) {
  var isAuthenticated = res.locals.accessrights.isAuthenticated();
  var userNeedsNotBeAdmin = false;
  var originalUrl = req.originalUrl;
  var user = req.user;

  if (isAuthenticated) {
    if (/members\/edit/.test(originalUrl)) {
      userNeedsNotBeAdmin = '/members/edit/' + encodeURIComponent(user.member.nickname) === originalUrl;
    }
    if (/members\/submit/.test(originalUrl)) {
      userNeedsNotBeAdmin = user.member ? (req.body.id === user.member.id) : true;
    }
    if (/members\/new/.test(originalUrl)) {
      userNeedsNotBeAdmin = !user.member;
    }
    if (/activities\/new/.test(originalUrl)) {
      userNeedsNotBeAdmin = true;
    }
    if (/activities\/edit/.test(originalUrl)) {
      userNeedsNotBeAdmin = true;
    }
    if (/activities\/submit/.test(originalUrl)) {
      userNeedsNotBeAdmin = true;
    }
    if (/wiki/.test(originalUrl)) {
      userNeedsNotBeAdmin = true;
    }
  }

  if (adminURLRegex.test(originalUrl)) {
    if (!userNeedsNotBeAdmin && !res.locals.accessrights.isAdmin()) {
      logger.info('Someone tried to access admin protected page.' + (user ? ' - User was: ' + user.authenticationId : ''));
      return res.redirect("/mustBeAdmin?page=" + encodeURIComponent(conf.get('publicUrlPrefix') + originalUrl));
    }
  }
  next();
};
