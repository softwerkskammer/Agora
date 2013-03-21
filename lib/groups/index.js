"use strict";

var groupsApp = require('express')();
var path = require('path');

groupsApp.set('views', path.join(__dirname, 'views'));
groupsApp.set('view engine', 'jade');

var sympaClient = require('../groups_administration/swkSympaClient');

groupsApp.get('/', function (req, res) {
  sympaClient.getGroups(function (err, groups) {
    res.render('groups', {title: 'Groups', groups: groups});
  });
});

module.exports = groupsApp;
