"use strict";

var path = require('path');

module.exports = function (app, conf) {

  var groups = require('./internalAPI')(conf);

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  // display all groups
  app.get('/', function (req, res) {
    var responseCallback = function (err, lists) {
      if (err) {
        console.log("Error: " + err);
      } else {
        res.render('index', {title: 'Alle Gruppen', lists: lists});
      }
    };

    groups.getAllAvailableGroups(responseCallback);
  });

  // display one group
  app.get('/:groupname', function (req, res) {
    var responseCallback = function (err, users) {
      if (err) {
        console.log("Error: " + err);
      } else {
        res.render('get', {title: 'Alle Mitglieder der Gruppe ' + req.params.groupname, users: users});
      }
    };

    groups.getUsersOfList(req.params.groupname, responseCallback);
  });

  return app;
};
