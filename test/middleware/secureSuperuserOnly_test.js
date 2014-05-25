'use strict';

var expect = require('must');
var conf = require('../../testutil/configureForTest');

var redirectIfNotSuperuser = conf.get('beans').get('secureSuperuserOnly');

describe('redirectIfNotSuperuser', function () {

  it('happpens when a normal user wants to access administraton pages', function (done) {
    var originalUrl = '/administration/something';

    var req = { originalUrl: originalUrl };

    var accessrights = {};
    accessrights.isAuthenticated = function () { return true; };
    accessrights.isSuperuser = function () { return false; };

    var res = { locals: { accessrights: accessrights } };
    // we do want the redirection to be invoked:
    res.redirect = function (args) {
      expect(args).to.exist();
      done();
    };

    redirectIfNotSuperuser(req, res, function () {
      done(new Error('We should have hit the redirect'));
    });
  });

  it('does not happpen when a normal user wants to access a page with "administatrion" as part of the URL', function (done) {
    var originalUrl = '/member/administration/';

    var req = { originalUrl: originalUrl };

    var accessrights = {};
    accessrights.isAuthenticated = function () { return true; };
    accessrights.isSuperuser = function () { return false; };

    var res = { locals: { accessrights: accessrights } };
    // we do not want the redirection to be invoked:
    res.redirect = function (args) {
      expect(args).to.exist();
      done(new Error('We should not have hit the redirect'));
    };

    redirectIfNotSuperuser(req, res, function () {
      done();
    });
  });
});
