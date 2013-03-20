"use strict";
var soap = require('soap');
var url = __dirname + '/wsdl/sympa.wsdl';
var args = {listname: 'craftsmanswap'};

var client = function () {};

var getInfoRequest = function (callback) {
    soap.createClient(url, function (err, client) {

        client.SOAPAction = function () {
            return "http://swk.monoceres.uberspace.de/fcgi-bin/sympa.fcgi/wsdl#info";
          };

        client.info(args, function (err, result) {
            callback(result.body);
          });

      });


  };




client.getInfoRequest = getInfoRequest;

module.exports = client;