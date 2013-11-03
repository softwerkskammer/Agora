"use strict";

var conf = require('../configureForTest');
var sinon = require('sinon');
var expect = require('chai').expect;

var beans = conf.get('beans');
var redirectRuleForNewUser = beans.get('redirectRuleForNewUser');
var secureAdminOnly = beans.get('secureAdminOnly');
var accessrights = beans.get('accessrights');

describe('redirection to registration page for authenticated but not yet registered users', function () {

  function checkFor(urlAndRedirect, done) {
    var req = {
      originalUrl: urlAndRedirect.url,
      user: {}
    };
    var res = {
      redirect: sinon.spy()
    };
    var next = sinon.spy();
    redirectRuleForNewUser(req, res, next);
    expect(res.redirect.calledWith('/members/new')).to.equal(urlAndRedirect.redirect);
    expect(next.called).to.not.equal(urlAndRedirect.redirect);
    done();
  }

  it('(almost) generally happens', function (done) {
    checkFor({url: '/something', redirect: true}, done);
  });

  it('happens for /something/new', function (done) {
    checkFor({url: '/something/new', redirect: true}, done);
  });

  it('does not happen for /members/new', function (done) {
    checkFor({url: '/members/new', redirect: false}, done);
  });

  it('happens for /something/submit', function (done) {
    checkFor({url: '/something/submit', redirect: true}, done);
  });

  it('does not happen for members/submit', function (done) {
    checkFor({url: '/members/submit', redirect: false}, done);
  });

  it('does not happen for /members/checknickname', function (done) {
    checkFor({url: '/members/checknickname', redirect: false}, done);
  });

  it('does not happen for /auth/logout', function (done) {
    checkFor({url: '/auth/logout', redirect: false}, done);
  });

  it('does not happen for frontend scripts', function (done) {
    checkFor({url: '/clientscripts/', redirect: false}, done);
  });

  it('does not happen for frontend stylesheets', function (done) {
    checkFor({url: '/stylesheets/', redirect: false}, done);
  });

  it('does not happen for frontend fonts', function (done) {
    checkFor({url: '/fonts/', redirect: false}, done);
  });

  it('does not happen for frontend images', function (done) {
    checkFor({url: '/img/', redirect: false}, done);
  });

});

describe('redirection to registration page for registered users', function () {

  it('does not happen', function (done) {
    var req = {
      originalUrl: '/members',
      user: {
        member: {}
      }
    };
    var next = sinon.spy();
    redirectRuleForNewUser(req, {}, next);
    expect(next.called).to.be.true;
    done();
  });

});

describe('redirection to registration page for anonymous users', function () {

  it('does not happen', function (done) {
    var req = {
      originalUrl: '/members'
    };
    var next = sinon.spy();
    redirectRuleForNewUser(req, {}, next);
    expect(next.called).to.be.true;
    done();
  });

});

describe('exceptions to the admin guard', function () {

  it('allows anonymous users to create their profile', function (done) {
    var req = {
      isAuthenticated: function () {return true; },
      originalUrl: '/members/new',
      user: {}
    };
    var res = {locals: {}};
    accessrights(req, res, function () {});
    var next = sinon.spy();
    secureAdminOnly(req, res, next);
    expect(next.called).to.be.true;
    done();
  });

  it('allows anonymous users to save their profile', function (done) {
    var req = {
      isAuthenticated: function () {return true; },
      originalUrl: '/members/submit',
      user: {}
    };
    var res = {locals: {}};
    accessrights(req, res, function () {});
    var next = sinon.spy();
    secureAdminOnly(req, res, next);
    expect(next.called).to.be.true;
    done();
  });

  it('allows registered users to edit their profile', function (done) {
    var req = {
      isAuthenticated: function () {return true; },
      originalUrl: '/members/edit/nick',
      user: {
        member: {nickname: 'nick'}
      }
    };
    var res = {locals: {}};
    accessrights(req, res, function () {});
    var next = sinon.spy();
    secureAdminOnly(req, res, next);
    expect(next.called).to.be.true;
    done();
  });

  it('allows registered users to edit their profile even with blanks in nickname', function (done) {
    var req = {
      isAuthenticated: function () {return true; },
      originalUrl: '/members/edit/nick%20name',
      user: {
        member: {nickname: 'nick name'}
      }
    };
    var res = {locals: {}};
    accessrights(req, res, function () {});
    var next = sinon.spy();
    secureAdminOnly(req, res, next);
    expect(next.called).to.be.true;
    done();
  });

  it('allows registered users to save their profile', function (done) {
    var req = {
      isAuthenticated: function () {return true; },
      originalUrl: '/members/submit',
      user: {
        member: {id: 'id'}
      },
      body: {id: 'id'}
    };
    var res = {locals: {}};
    accessrights(req, res, function () {});
    var next = sinon.spy();
    secureAdminOnly(req, res, next);
    expect(next.called).to.be.true;
    done();
  });

  it('does not allow registered users to edit other\'s profiles', function (done) {
    var req = {
      isAuthenticated: function () {return true; },
      originalUrl: '/members/edit/nick',
      user: {
        member: {nickname: 'nic'}
      }
    };
    var res = {
      locals: {},
      redirect: sinon.spy()
    };
    accessrights(req, res, function () {});
    var next = sinon.spy();
    secureAdminOnly(req, res, next);
    expect(/\/mustBeAdmin/.test(res.redirect.getCall(0).args[0])).to.be.true;
    expect(next.called).to.be.false;
    done();
  });

  it('does not allow registered users to edit other\'s profiles', function (done) {
    var req = {
      isAuthenticated: function () {return true; },
      originalUrl: '/members/edit/nick',
      user: {
        member: {nickname: 'ick'}
      }
    };
    var res = {
      locals: {},
      redirect: sinon.spy()
    };
    accessrights(req, res, function () {});
    var next = sinon.spy();
    secureAdminOnly(req, res, next);
    expect(/\/mustBeAdmin/.test(res.redirect.getCall(0).args[0])).to.be.true;
    expect(next.called).to.be.false;
    done();
  });

});
