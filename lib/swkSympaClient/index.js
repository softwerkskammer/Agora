"use strict";

var express = require('express');
var app = module.exports = express();

var swkSympaClient = require('./client');

app.get('/', function (req, res) {
    var responseCallback = function (soapResult) {
        var myResponse = "Hallo Softwerkskammer :-)" +
            "\n" +
            "\n" +
            "Response auf den Info Request:" +
            "\n" +
            "\n" +
            soapResult;
        res.send(myResponse);
      };

    swkSympaClient.getInfoRequest(responseCallback);

  });

