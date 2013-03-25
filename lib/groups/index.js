"use strict";

var groupsApp = require('express')();
var path = require('path');
var sympaClient = require('./sympa')({});

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
  var responseCallback = function (err, soapResult) {
    if (err) {
      console.log("Error: " + err);
    } else {
      res.render('lists', {title: 'Lists', lists: soapResult.listInfo.item});
    }
  };

  sympaClient.getLists(responseCallback);
});

groupsApp.get('/users', function (req, res) {
  var responseCallback = function (err, soapResult) {
    if (err) {
      console.log("Error: " + err);
    } else {
      res.render('users', {title: 'Users', users: soapResult.return});
    }
  };

  sympaClient.getUsersOfList('neueplattform@softwerkskammer.de', responseCallback);
});

groupsApp.get('/subscribed', function (req, res) {
  var responseCallback = function (err, soapResult) {
    if (err) {
      console.log("Error: " + err);
    } else {
      res.render('subscribed', {title: 'nicole.rauch@me.com subscribed', subscribed: soapResult.return.item});
    }
  };

  sympaClient.getSubscribedListsForUser('nicole.rauch@me.com', responseCallback);
});

module.exports = groupsApp;
