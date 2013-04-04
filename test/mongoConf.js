"use strict";

var nconf = require('nconf');

function MongoConf() {
  nconf.file('../config/mongo-config.json');
  nconf.defaults({
    mongoHost: 'localhost',
    mongoPort: '27017',
    'logging': {
      'application': {
        'consoleLevel': 'info'
      },
      'http': {
        'consoleLevel': 'warn'
      }
    }
  });
  this.values = [];
  this.values['mongoHost'] = nconf.get('mongoHost');
  this.values['mongoPort'] = nconf.get('mongoPort');
  this.values['mongoUser'] = nconf.get('mongoUser');
  this.values['mongoPass'] = nconf.get('mongoPass');
  this.values['logging:application:consoleLevel'] = nconf.get('logging:application:consoleLevel');
  this.values['logging:http:consoleLevel'] = nconf.get('logging:http:consoleLevel');
}

MongoConf.prototype.get = function (key) {
  return this.values[key];
};

MongoConf.prototype.set = function (key, value) {
  return this.values[key] = value;
};

module.exports = MongoConf;