"use strict";

var groupsApp = require('express')();
var path = require('path');
var sympaClient = require('./sympa')({});
var groupstore = require('../groups/groupstore');
var async = require('async');

groupsApp.set('views', path.join(__dirname, 'views'));
groupsApp.set('view engine', 'jade');

groupsApp.get('/', function (req, res) {
  sympaClient.getGroups(function (err, groups) {
    if (err) {
      console.log("Error: " + err);
    } else {
      res.render('groups', {title: 'Groups', groups: groups});
    }
  });
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
  var responseCallback = function (err, soapResult) {
    if (err) {
      console.log("Error: " + err);
    } else {
      res.render('users', {title: 'Users', users: soapResult.return.item});
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

groupsApp.getSubscribedListsForUser = function (email, globalCallback) {
  async.waterfall([
    function (callback) {
      sympaClient.getSubscribedListsForUser(email, callback);
    }
  ],
  function (err, subscribedLists) {
    var iterator = function (list, callback) {
      groupstore.getGroup(list.listAddress, callback);
    };
    async.map(subscribedLists, iterator, globalCallback);
  });
};


module.exports = groupsApp;