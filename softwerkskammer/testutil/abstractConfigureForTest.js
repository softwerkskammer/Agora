'use strict';

module.exports = function (testBeansFilename) {

  var nconf = require('nconf');
  var merge = require('utils-merge');
  var Beans = require('CoolBeans');
  require('./shutupWinston')();

  // beans:
  var productionBeans = require('../../config/beans.json');
  var testBeans = require('../../config/' + testBeansFilename);
  merge(productionBeans, testBeans);

  nconf.overrides({
    port: '17125',
    swkTrustedAppName: null,
    swkTrustedAppPwd: null,
    swkRemoteAppUser: null,
    dontUsePersistentSessions: true,
    superuser: 'superuserID',
    wikipath: '..',
    beans: new Beans(productionBeans),
    transport: null,
    'transport-options': null,
    'sender-address': null,
    publicUrlPrefix: 'http://localhost:17125',
    secret: 'secret',
    githubClientID : null,
    githubClientSecret : null,
    publicPaymentKey: null,
    secretPaymentKey: null,
    paymentBic      : 'paymentBic',
    paymentIban     : 'paymentIban',
    paymentReceiver : 'paymentReceiver',
    emaildomainname      : 'localhost',
    imageDirectory  : null
  });

  return require('../configure');

};

