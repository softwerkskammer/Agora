'use strict';

var _ = require('lodash');
var async = require('async');

var beans = require('simple-configure').get('beans');
var misc = beans.get('misc');
var membersService = beans.get('membersService');
var subscriberService = beans.get('subscriberService');
var Member = beans.get('member');
var memberSubmitHelper = beans.get('memberSubmitHelper');

var app = misc.expressAppIn(__dirname);

app.get('/checknickname', function (req, res) {
  misc.validate(req.query.nickname, req.query.previousNickname, membersService.isValidNickname, res.end);
});

app.get('/checkemail', function (req, res) {
  misc.validate(req.query.email, req.query.previousEmail, membersService.isValidEmail, res.end);
});

app.get('/edit', function (req, res) {
  var member = req.user.member || new Member().initFromSessionUser(req.user, true);
  res.render('edit', {member: member});
});

app.post('/submit', function (req, res, next) {
  memberSubmitHelper(req, res, function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.get('/:nickname', function (req, res, next) {
  subscriberService.getMemberIfSubscriberExists(req.params.nickname, function (err, member) {
    if (err || !member) { return next(err); }
    res.render('get', {member: member});
  });
});

module.exports = app;
