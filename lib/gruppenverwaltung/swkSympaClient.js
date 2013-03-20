"use strict";
var soap = require('soap');
var url = __dirname + '/wsdl/sympa.wsdl';
var args = {listname: 'craftsmanswap'};

var client = {};

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

var getGruppen = function (callback) {
  callback(null, [{id: 'dummy id 1', name: 'dummy name 1'}, {id: 'dummy id 2', name: 'dummy name 2'}]);
};

client.getInfoRequest = getInfoRequest;
client.getGruppen = getGruppen;

module.exports = client;