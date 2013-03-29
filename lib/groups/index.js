"use strict";

var path = require('path');

module.exports = function (app, conf) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  var sympaClient = require('./sympa')(conf);

  app.get('/', function (req, res) {
    sympaClient.getGroups(function (err, groups) {
      if (err) {
        console.log("Error: " + err);
      } else {
        res.render('groups', {title: 'Groups', groups: groups});
      }
    });
  });

  app.get('/lists', function (req, res) {
    var responseCallback = function (err, lists) {
      if (err) {
        console.log("Error: " + err);
      } else {
        res.render('lists', {title: 'Lists', lists: lists});
      }
    };

    sympaClient.getAllAvailableLists(responseCallback);
  });

  app.get('/users', function (req, res) {
    var responseCallback = function (err, soapResult) {
      if (err) {
        console.log("Error: " + err);
      } else {
        res.render('users', {title: 'Users', users: soapResult.return.item});
      }
    };

    sympaClient.getUsersOfList('neueplattform@softwerkskammer.de', responseCallback);
  });

  app.get('/subscribed', function (req, res) {
    var responseCallback = function (err, subscribed) {
      if (err) {
        console.log("Error: " + err);
      } else {
        res.render('subscribed', {title: 'nicole.rauch@me.com subscribed', subscribed: subscribed});
      }
    };

    sympaClient.getSubscribedListsForUser('nicole.rauch@me.com', responseCallback);
  });

  return app;
};

