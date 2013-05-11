"use strict";

var path = require('path');
var moment = require('moment');
var async = require('async');
var _ = require('underscore');
var conf = require('nconf');

var validation = conf.get('beans').get('validation');

module.exports = function (app) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  var api = conf.get('beans').get('mailAPI');
  var membersAPI = conf.get('beans').get('membersAPI');
  var mailAPI = conf.get('beans').get('mailAPI');
  var Message = conf.get('beans').get('message');

  function messageSubmitted(req, res, next) {
    if(!req.user || !req.user.member){
      return next(null); // error: user must be logged in
    }

    var message = new Message(req.body, req.user.member);
    var errors = validation.isValidMessage(message);
    if (errors.length !== 0) { return res.render('../../../views/errorPages/validationError', {errors: errors}); }

    mailAPI.sendMail(message, function (err) {
      if (err) { return next(err); }
      res.redirect('/mail/success');
    });
  }

  app.get('/', function (req, res, next) {
    res.render('compose', {});
  });

  app.get('/success', function (req, res, next) {
    res.render('success', {});
  });

  app.post('/submit', function (req, res, next) {
    messageSubmitted(req, res, next);
  });

  return app;
};
