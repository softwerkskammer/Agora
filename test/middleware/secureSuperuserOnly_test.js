"use strict";

var expect = require('must');
var conf = require('../../testutil/configureForTest');

var redirectIfNotSuperuser = conf.get('beans').get('secureSuperuserOnly');

describe('redirectIfNotSuperuser', function () {

  it('does not care about case of escaped umlauts in URL when editing a member profile', function (done) {
    var originalUrl = '/administration/something';

    var req = { originalUrl: originalUrl, user: {member: { nickname: function () { return 'NicoläZumTesten'; }}} };

    var accessrights = {};
    accessrights.isAuthenticated = function () { return true; };
    accessrights.isSuperuser = function () { return false; };

    var res = { locals: { accessrights: accessrights } };
    // we do not want the redirection to be invoked:
    res.redirect = function (args) {
      expect(args).to.exist();
      done();
    };

    redirectIfNotSuperuser(req, res, function () {
      done(new Error('We should have hit the redirect'));
    });
  });
});
