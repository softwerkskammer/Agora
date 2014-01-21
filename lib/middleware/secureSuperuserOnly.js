"use strict";

var conf = require('nconf');
var winston = require('winston');
var logger = winston.loggers.get('authorization');
var superuserURLRegex = new RegExp(conf.get('superuserURLPattern'));

module.exports = function redirectIfNotSuperuser(req, res, next) {
  var isAuthenticated = res.locals.accessrights.isAuthenticated();
  var userNeedsNotBeSuperuser = false;
  var originalUrl = req.originalUrl;
  var user = req.user;

  if (isAuthenticated) {
    if (/members\/edit/.test(originalUrl)) {
      userNeedsNotBeSuperuser = '/members/edit/' + encodeURIComponent(user.member.nickname()).toLowerCase() === originalUrl.toLowerCase();
    }
    if (/members\/submit/.test(originalUrl)) {
      userNeedsNotBeSuperuser = user.member ? (req.body.id === user.member.id()) : true;
    }
    if (/members\/new/.test(originalUrl)) {
      userNeedsNotBeSuperuser = !user.member;
    }
    if (/activities\/new/.test(originalUrl)) {
      userNeedsNotBeSuperuser = true;
    }
    if (/activities\/edit/.test(originalUrl)) {
      userNeedsNotBeSuperuser = true;
    }
    if (/activities\/submit/.test(originalUrl)) {
      userNeedsNotBeSuperuser = true;
    }
    if (/waitinglist\/submit/.test(originalUrl)) {
      userNeedsNotBeSuperuser = true;
    }
    if (/groups\/new/.test(originalUrl)) {
      userNeedsNotBeSuperuser = true;
    }
    if (/groups\/edit/.test(originalUrl)) {
      userNeedsNotBeSuperuser = true;
    }
    if (/groups\/submit/.test(originalUrl)) {
      userNeedsNotBeSuperuser = true;
    }
    if (/wiki/.test(originalUrl)) {
      userNeedsNotBeSuperuser = true;
    }
  }

  if (superuserURLRegex.test(originalUrl)) {
    if (!userNeedsNotBeSuperuser && !res.locals.accessrights.isSuperuser()) {
      logger.info('Someone tried to access superuser protected page.' + (user ? ' - User was: ' + user.authenticationId : ''));
      return res.redirect("/mustBeSuperuser?page=" + encodeURIComponent(conf.get('publicUrlPrefix') + originalUrl));
    }
  }
  next();
};
