"use strict";

var path = require('path');

module.exports = function (app, conf) {

  var sympaClient;
  //Just checking if remote has been configured
  if (conf.get('swkTrustedAppName') || conf.get('swkTrustedAppPwd')) {
    sympaClient = require('./sympa')(conf);
  }
  else {
    sympaClient = require('./sympaStub')(conf);
  }

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.get('/', function (req, res) {

    res.render('groups', {title: 'Groups', groups: null});
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
    var responseCallback = function (err, users) {
      if (err) {
        console.log("Error: " + err);
      } else {
        res.render('users', {title: 'Users', users: users});
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
