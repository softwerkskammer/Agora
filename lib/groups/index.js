"use strict";

var groupsApp = require('express')();
var path = require('path');
var sympaClient = require('./sympa')({});

groupsApp.set('views', path.join(__dirname, 'views'));
groupsApp.set('view engine', 'jade');

groupsApp.get('/', function (req, res) {
  sympaClient.getGroups(function (err, groups) {
    res.render('groups', {title: 'Groups', groups: groups});
  });
});

groupsApp.get('/lists', function (req, res) {
  var responseCallback = function (err, soapResult) {
      res.render('lists', {title: 'Lists', lists: soapResult.listInfo.item});
    };

  sympaClient.getLists(responseCallback);
});

module.exports = groupsApp;
