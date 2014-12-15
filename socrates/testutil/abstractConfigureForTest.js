'use strict';

module.exports = function (firstTestBeansFilename, secondTestBeansFilename) {

  var nconf = require('simple-configure');
  var merge = require('utils-merge');
  var Beans = require('CoolBeans');
  require('../../softwerkskammer/testutil/shutupWinston')();

  // first, set the normal configuration (important e.g. for mongoDB)
  require('../configure');

  // then, overwrite what needs to be changed:

  // beans:
  var productionBeans = require('../../config/beans.json');
  var secondProductionBeans = require('../../config/beans-socrates.json');
  var firstTestBeans = require('../../config/' + firstTestBeansFilename);
  var secondTestBeans = require('../../config/' + secondTestBeansFilename);
  merge(productionBeans, secondProductionBeans);
  merge(productionBeans, firstTestBeans);
  merge(productionBeans, secondTestBeans);

  nconf.addProperties({
    port: '17225',
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
    publicUrlPrefix: 'http://localhost:17225',
    secret: 'secret',
    sessionkey: 'testsession',
    githubClientID : null,
    githubClientSecret : null,
    publicPaymentKey: null,
    secretPaymentKey: null,
    paymentBic      : 'paymentBic',
    paymentIban     : 'paymentIban',
    paymentReceiver : 'paymentReceiver',
    emaildomainname : 'localhost',
    imageDirectory  : null
  });

  return nconf;
};
