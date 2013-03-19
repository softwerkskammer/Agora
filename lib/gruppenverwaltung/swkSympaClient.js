/**
 * Created with JetBrains WebStorm.
 * User: flunky
 * Date: 19.03.13
 * Time: 07:50
 * To change this template use File | Settings | File Templates.
 */
"use strict";
var soap = require('soap');
var url = 'http://swk.monoceres.uberspace.de/fcgi-bin/sympa.fcgi/wsdl';
var args = {listname: 'craftsmanswap'};

var client = function () {};

var getInfoRequest = function (callback) {
    soap.createClient(url, function (err, client) {
        client.info(args, function (err, result) {
            callback(result.body);
          });
      });


  };

client.getInfoRequest = getInfoRequest;

module.exports = client;