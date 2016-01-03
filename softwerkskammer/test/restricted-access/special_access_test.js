'use strict';

var sinon = require('sinon');
var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');
var redirectRuleForNewUser = beans.get('redirectRuleForNewUser');
var secureSuperuserOnly = beans.get('secureSuperuserOnly');
var accessrights = beans.get('accessrights');
var Member = beans.get('member');

describe('redirection to registration page for authenticated but not yet registered users', function () {

  function checkFor(urlAndRedirect) {
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
  }

  it('(almost) generally happens', function () {
    checkFor({url: '/something', redirect: true});
  });

  it('happens for /something/new', function () {
    checkFor({url: '/something/new', redirect: true});
  });

  it('does not happen for /members/new', function () {
    checkFor({url: '/members/new', redirect: false});
  });

  it('happens for /something/submit', function () {
    checkFor({url: '/something/submit', redirect: true});
  });

  it('does not happen for members/submit', function () {
    checkFor({url: '/members/submit', redirect: false});
  });

  it('does not happen for /members/checknickname', function () {
    checkFor({url: '/members/checknickname', redirect: false});
  });

  it('does not happen for /auth/logout', function () {
    checkFor({url: '/auth/logout', redirect: false});
  });

  it('does not happen for frontend scripts', function () {
    checkFor({url: '/clientscripts/', redirect: false});
  });

  it('does not happen for frontend stylesheets', function () {
    checkFor({url: '/stylesheets/', redirect: false});
  });

  it('does not happen for frontend fonts', function () {
    checkFor({url: '/fonts/', redirect: false});
  });

  it('does not happen for frontend images', function () {
    checkFor({url: '/img/', redirect: false});
  });

});

describe('redirection to registration page for "SoCraTes only members"', function () {

  function checkFor(urlAndRedirect) {
    var req = {
      originalUrl: urlAndRedirect.url,
      user: {
        member: {
          socratesOnly: function () { return true; },
          nickname: function () { return 'nick'; }
        }
      }
    };
    var res = {
      redirect: sinon.spy()
    };
    var next = sinon.spy();
    redirectRuleForNewUser(req, res, next);
    expect(res.redirect.calledWith('/members/edit/nick')).to.equal(urlAndRedirect.redirect);
    expect(next.called).to.not.equal(urlAndRedirect.redirect);
  }

  it('(almost) generally happens', function () {
    checkFor({url: '/something', redirect: true});
  });

  it('happens for /something/new', function () {
    checkFor({url: '/something/new', redirect: true});
  });

  it('does not happen for /members/new', function () {
    checkFor({url: '/members/new', redirect: false});
  });

  it('does not happen for /members/edit', function () {
    checkFor({url: '/members/edit', redirect: false});
  });

  it('happens for /something/submit', function () {
    checkFor({url: '/something/submit', redirect: true});
  });

  it('does not happen for members/submit', function () {
    checkFor({url: '/members/submit', redirect: false});
  });

  it('does not happen for /members/checknickname', function () {
    checkFor({url: '/members/checknickname', redirect: false});
  });

  it('does not happen for /auth/logout', function () {
    checkFor({url: '/auth/logout', redirect: false});
  });

  it('does not happen for frontend scripts', function () {
    checkFor({url: '/clientscripts/', redirect: false});
  });

  it('does not happen for frontend stylesheets', function () {
    checkFor({url: '/stylesheets/', redirect: false});
  });

  it('does not happen for frontend fonts', function () {
    checkFor({url: '/fonts/', redirect: false});
  });

  it('does not happen for frontend images', function () {
    checkFor({url: '/img/', redirect: false});
  });

});

describe('redirection to registration page for registered users', function () {

  it('does not happen', function () {
    var req = {
      originalUrl: '/members',
      user: {
        member: {socratesOnly: function () { return false; }}
      }
    };
    var next = sinon.spy();
    redirectRuleForNewUser(req, {}, next);
    expect(next.called).to.be(true);
  });

});

describe('redirection to registration page for anonymous users', function () {

  it('does not happen', function () {
    var req = {
      originalUrl: '/members'
    };
    var next = sinon.spy();
    redirectRuleForNewUser(req, {}, next);
    expect(next.called).to.be(true);
  });

});

describe('exceptions to the admin guard', function () {

  it('allows anonymous users to create their profile', function () {
    var req = {
      originalUrl: '/members/new',
      user: {}
    };
    var res = {locals: {}};
    accessrights(req, res, function () { return undefined; });
    var next = sinon.spy();
    secureSuperuserOnly(req, res, next);
    expect(next.called).to.be(true);
  });

  it('allows anonymous users to save their profile', function () {
    var req = {
      originalUrl: '/members/submit',
      user: {}
    };
    var res = {locals: {}};
    accessrights(req, res, function () { return undefined; });
    var next = sinon.spy();
    secureSuperuserOnly(req, res, next);
    expect(next.called).to.be(true);
  });

  it('allows registered users to edit their profile', function () {
    var req = {
      originalUrl: '/members/edit/nick',
      user: {
        member: new Member({nickname: 'nick'})
      }
    };
    var res = {locals: {}};
    accessrights(req, res, function () { return undefined; });
    var next = sinon.spy();
    secureSuperuserOnly(req, res, next);
    expect(next.called).to.be(true);
  });

  it('allows registered users to edit their profile even with blanks in nickname', function () {
    var req = {
      originalUrl: '/members/edit/nick%20name',
      user: {
        member: new Member({nickname: 'nick name'})
      }
    };
    var res = {locals: {}};
    accessrights(req, res, function () { return undefined; });
    var next = sinon.spy();
    secureSuperuserOnly(req, res, next);
    expect(next.called).to.be(true);
  });

  it('allows registered users to save their profile', function () {
    var req = {
      originalUrl: '/members/submit',
      user: {
        member: new Member({id: 'id'})
      },
      body: {id: 'id'}
    };
    var res = {locals: {}};
    accessrights(req, res, function () { return undefined; });
    var next = sinon.spy();
    secureSuperuserOnly(req, res, next);
    expect(next.called).to.be(true);
  });

});
