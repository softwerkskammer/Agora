'use strict';

var _ = require('lodash');
var async = require('async');

var beans = require('simple-configure').get('beans');
var misc = beans.get('misc');
var membersService = beans.get('membersService');
var subscriberService = beans.get('subscriberService');
var Member = beans.get('member');
var memberSubmitHelper = beans.get('memberSubmitHelper');
var fieldHelpers = beans.get('fieldHelpers');
var subscriberstore = beans.get('subscriberstore');

var app = misc.expressAppIn(__dirname);

app.get('/checknickname', function (req, res) {
  misc.validate(req.query.nickname, req.query.previousNickname, membersService.isValidNickname, res.end);
});

app.get('/checkemail', function (req, res) {
  misc.validate(req.query.email, req.query.previousEmail, membersService.isValidEmail, res.end);
});

app.get('/edit', function (req, res, next) {
  if (!req.user.member) {
    return res.render('edit', {member: new Member().initFromSessionUser(req.user, true)});
  }
  var member = req.user.member;
  subscriberstore.getSubscriber(member.id(), function (err, subscriber) {
    if (err) { return next(err); }
    res.render('edit', {
      member: member,
      addon: subscriber && subscriber.addon(),
      participation: subscriber && subscriber.isParticipating() ? subscriber.currentParticipation() : null
    });
  });
});

app.post('/submit', function (req, res, next) {
  memberSubmitHelper(req, res, function (err) {
    if (err) { return next(err); }
    subscriberstore.getSubscriber(req.user.member.id(), function (err, subscriber) {
      if (err) { return next(err); }
      subscriber.fillFromUI(req.body);
      subscriberstore.saveSubscriber(subscriber, function (err) {
        if (err) { return next(err); }
        if (subscriber.needsToPay()) {
          return res.redirect('/payment/socrates');
        }
        res.redirect('/');
      });
    });

  });
});

app.get('/:nickname', function (req, res, next) {
  subscriberService.getMemberIfSubscriberExists(req.params.nickname, function (err, member) {
    if (err || !member) { return next(err); }
    res.render('get', {member: member});
  });
});

module.exports = app;
