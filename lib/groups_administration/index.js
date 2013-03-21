"use strict";

var groupsAdministrationApp = require('express')();

var swkSympaClient = require('./swkSympaClient');

groupsAdministrationApp.get('/', function (req, res) {
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

  swkSympaClient.getInfoRequest(responseCallback);

});

module.exports = groupsAdministrationApp;
