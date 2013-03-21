"use strict";

var groupsApp = require('express')();
var path = require('path');
var sympaClient = require('./sympa');

groupsApp.set('views', path.join(__dirname, 'views'));
groupsApp.set('view engine', 'jade');

groupsApp.get('/', function (req, res) {
  sympaClient.getGroups(function (err, groups) {
    res.render('groups', {title: 'Groups', groups: groups});
  });
});

groupsApp.get('/soap', function (req, res) {
  var responseCallback = function (soapResult) {
      var myResponse = "Groups Administration " +
          "\n" +
          "\n" +
          "Test of the SOAP communication with Sympa " +
          "\n" +
          "\n" +
          "Response for the info request:" +
          "\n" +
          "\n" +
          soapResult;

      res.setHeader('Content-Type', 'text/plain');
      res.end(myResponse);
    };

  sympaClient.getInfoRequest(responseCallback);
});

module.exports = groupsApp;
