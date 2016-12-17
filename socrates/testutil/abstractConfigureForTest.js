'use strict';

module.exports = function (firstTestBeansFilename, secondTestBeansFilename) {

  const conf = require('simple-configure');
  const Beans = require('CoolBeans');
  require('../../softwerkskammer/testutil/shutupWinston')();

  // first, set the normal configuration (important e.g. for mongoDB)
  require('../configure');

  // then, overwrite what needs to be changed:

  // beans:
  const productionBeans = require('../../config/beans.json');
  const secondProductionBeans = require('../../config/beans-socrates.json');
  const firstTestBeans = require('../../config/' + firstTestBeansFilename);
  const secondTestBeans = require('../../config/' + secondTestBeansFilename);
  Object.assign(productionBeans, secondProductionBeans, firstTestBeans, secondTestBeans);

  conf.addProperties({
    port: '17225',
    dontUsePersistentSessions: true,
    superuser: 'superuserID',
    socratesAdmins: ['socratesAdminID'],
    wikipath: '..',
    beans: new Beans(productionBeans),
    transport: null,
    'transport-options': null,
    'sender-address': null,
    publicUrlPrefix: 'http://localhost:17225',
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
    imageDirectory: null
  });

  return conf;
};
