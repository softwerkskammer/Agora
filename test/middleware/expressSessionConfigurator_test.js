'use strict';

var conf = require('../../testutil/configureForTest');
var beans = conf.get('beans');
var expressSessionConfigurator = beans.get('expressSessionConfigurator');
var MemoryStore = require('express-session').MemoryStore;
var expect = require('must');

describe('Configuration sets Persistent Store only if configured', function () {

  it('to RAM Store', function () {
    var req = {
      originalUrl: '/something',
      cookies: {},
      signedCookies: {}
    };
    var next = function () { return ''; };
    expressSessionConfigurator(req, {}, next);

    expect(conf.get('dontUsePersistentSessions')).to.be(true);
    expect(req.sessionStore).to.be.a(MemoryStore);
  });

});

