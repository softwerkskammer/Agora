"use strict";

var conf = require('../configureForTest');

var redirectIfNotSuperuser = conf.get('beans').get('secureSuperuserOnly');
//var expect = require('chai').expect;

describe('redirectIfNotSuperuser', function () {

  it('does not care about case of escaped umlauts in URL when editing a member profile', function (done) {
    var originalUrl = '/members/edit/Nicol%c3%a4ZumTesten';

    var req = { originalUrl: originalUrl, user: {member: { nickname: function () { return 'NicoläZumTesten'; }}} };

    var accessrights = {};
    accessrights.isAuthenticated = function () { return true; };
    accessrights.isSuperuser = function () { return false; };

    var res = { locals: { accessrights: accessrights } };
    // we do not want the redirection to be invoked:
    res.redirect = function () { done(new Error('URL escaping did not match - possibly because of case sensitive comparison.')); };

    redirectIfNotSuperuser(req, res, done);
  });
});
