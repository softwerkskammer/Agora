"use strict";

var path = require('path');
var sympaClient = require('./sympa')({});

module.exports = function (app) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.get('/', function (req, res) {
    sympaClient.getGroups(function (err, groups) {
      res.render('groups', {title: 'Groups', groups: groups});
    });
  });

  app.get('/lists', function (req, res) {
    var responseCallback = function (err, soapResult) {
        res.render('lists', {title: 'Lists', lists: soapResult.listInfo.item});
      };

    sympaClient.getLists(responseCallback);
  });

  app.get('/review', function (req, res) {
    var responseCallback = function (err, soapResult) {
        res.render('lists', {title: 'Lists', lists: soapResult.listInfo.item});
      };

    sympaClient.review(responseCallback);
  });

  return app;
};