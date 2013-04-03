"use strict";

var nconf = require('nconf');

function MongoConf() {
  nconf.file('../config/mongo-config.json');
  nconf.defaults({
    mongoHost: 'localhost',
    mongoPort: '27017',
    'logging': {
      'application': {
        'filename': 'log/server.log',
        'maxSize': '10485760',
        'maxFiles': '5',
        'consoleLevel': 'info',
        'fileLevel': 'info'
      },
      'http': {
        'filename': 'log/http.log',
        'maxSize': '10485760',
        'maxFiles': '5',
        'consoleLevel': 'warn',
        'fileLevel': 'info'
      }
    }
  });
  this.values = [];
  this.values['mongoHost'] = nconf.get('mongoHost');
  this.values['mongoPort'] = nconf.get('mongoPort');
  this.values['mongoUser'] = nconf.get('mongoUser');
  this.values['mongoPass'] = nconf.get('mongoPass');
  this.values['logging:application:filename'] = 'log/http.log';
  this.values['logging:http:filename'] = 'log/http.log';
}

MongoConf.prototype.get = function (key) {
  return this.values[key];
};

MongoConf.prototype.set = function (key, value) {
  return this.values[key] = value;
};

module.exports = MongoConf;