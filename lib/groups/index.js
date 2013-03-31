"use strict";

var path = require('path');



module.exports = function (app, conf) {
  var sympaService = require('./sympaService')(conf);

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

    sympaService.getAllAvailableLists(responseCallback);
  });

  app.get('/users', function (req, res) {
    var responseCallback = function (err, users) {
      if (err) {
        console.log("Error: " + err);
      } else {
        res.render('users', {title: 'Users', users: users});
      }
    };

    sympaService.getUsersOfList('neueplattform@softwerkskammer.de', responseCallback);
  });

  app.get('/subscribed', function (req, res) {
    var responseCallback = function (err, subscribed) {
      if (err) {
        console.log("Error: " + err);
      } else {
        res.render('subscribed', {title: 'nicole.rauch@me.com subscribed', subscribed: subscribed});
      }
    };

    sympaService.getSubscribedListsForUser('nicole.rauch@me.com', responseCallback);
  });

  return app;
};
