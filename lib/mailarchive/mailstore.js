"use strict";
var conf = require('nconf');
var async = require('async');
var _ = require('underscore');

var persistence = conf.get('beans').get('mailsPersistence');
var Mail = conf.get('beans').get('mail');

var toMail = function (callback, err, mail) {
  if (err) { return callback(err); }
  if (mail) { return callback(null, new Mail(mail)); }
  callback(null, null);
};

var toMailList = function (callback, err, mails) {
  if (err) { return callback(err); }
  callback(null, _.map(mails, function (mail) { return new Mail(mail); }));
};

module.exports = {
  mailHeaders: function (searchObject, callback) {
    persistence.listByFieldWithOptions(searchObject,
      {text: 0, html: 0},
      {timeUnix: 1},
      async.apply(toMailList, callback));
  },
  mailForId: function (id, callback) {
    persistence.getById(id, async.apply(toMail, callback));
  }
};


