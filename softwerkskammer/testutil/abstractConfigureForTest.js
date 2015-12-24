'use strict';

module.exports = function (testBeansFilename) {

  var conf = require('simple-configure');
  var _ = require('lodash');
  var Beans = require('CoolBeans');
  require('./shutupWinston')();

  // first, set the normal configuration (important e.g. for mongoDB)
  require('../configure');

  // then, overwrite what needs to be changed:

  // beans:
  var productionBeans = require('../../config/beans.json');
  var testBeans = require('../../config/' + testBeansFilename);
  _.assign(productionBeans, testBeans);

  conf.addProperties({
    port: '17125',
    dontUsePersistentSessions: true,
    superuser: 'superuserID',
    wikipath: '..',
    beans: new Beans(productionBeans),
    transport: null,
    'transport-options': null,
    'sender-address': null,
    publicUrlPrefix: 'http://localhost:17125',
    secret: 'secret',
    sessionkey: 'testsession',
    githubClientID: null,
    githubClientSecret: null,
    publicPaymentKey: null,
    secretPaymentKey: null,
    paymentBic: 'paymentBic',
    paymentIban: 'paymentIban',
    paymentReceiver: 'paymentReceiver',
    emaildomainname: 'localhost',
    imageDirectory: null,
    socratesURL: 'https://socrates.com:12345',
    fullyQualifiedHomeDir: null
  });

  return conf;
};

