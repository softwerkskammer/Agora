"use strict";

var groupsApp = require('express')();
var path = require('path');
var _s = require('underscore.string');

var sympaClient;
//Just checking if remote has been configured, replace by nconf
if (!_s.isBlank(process.env.REMOTE_APP_NAME) || !_s.isBlank(process.env.REMOTE_APP_PWD)) {
  sympaClient = require('./sympa')({});
}
else {
  sympaClient = require('./sympaStub')({});
}

groupsApp.set('views', path.join(__dirname, 'views'));
groupsApp.set('view engine', 'jade');

groupsApp.get('/', function (req, res) {

  res.render('groups', {title: 'Groups', groups: null});
});

groupsApp.get('/lists', function (req, res) {
  var responseCallback = function (err, lists) {
    if (err) {
      console.log("Error: " + err);
    } else {
      res.render('lists', {title: 'Lists', lists: lists});
    }
  };

  sympaClient.getAllAvailableLists(responseCallback);
});

groupsApp.get('/users', function (req, res) {
  var responseCallback = function (err, users) {
    if (err) {
      console.log("Error: " + err);
    } else {
      res.render('users', {title: 'Users', users: users});
    }
  };

  sympaClient.getUsersOfList('neueplattform@softwerkskammer.de', responseCallback);
});

groupsApp.get('/subscribed', function (req, res) {
  var responseCallback = function (err, subscribed) {
    if (err) {
      console.log("Error: " + err);
    } else {
      res.render('subscribed', {title: 'nicole.rauch@me.com subscribed', subscribed: subscribed});
    }
  };

  sympaClient.getSubscribedListsForUser('nicole.rauch@me.com', responseCallback);
});

module.exports = groupsApp;