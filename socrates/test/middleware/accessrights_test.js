'use strict';

var expect = require('must-dist');
var sinon = require('sinon').sandbox.create();

var conf = require('../../testutil/configureForTest');
var beans = conf.get('beans');
var socratesActivitiesService = beans.get('socratesActivitiesService');
var accessrights = beans.get('accessrights');

describe('accessrights', function () {

  var req;
  var res;
  var next;
  var socrates;

  beforeEach(function () {
    socrates = {};
    sinon.stub(socratesActivitiesService, 'getCurrentSocrates', function (callback) { callback(null, socrates); });
    req = {};
    res = {locals: {}};
    next = function () { return; };

    accessrights(req, res, next);
  });

  afterEach(function () {
    sinon.restore();
  });

  var loginAs = function (memberId) {
    req.user = {member: {id: function () {return memberId; }}};
  };

  it('does not allow activity editing if nobody is logged in', function () {
    expect(res.locals.accessrights.canEditActivity()).to.be.false();
  });

  it('does not allow activity editing for non-superusers', function () {
    loginAs('memberId');
    expect(res.locals.accessrights.canEditActivity()).to.be.false();
  });

  it('allows activity editing for superusers', function () {
    loginAs('superuserID');
    expect(res.locals.accessrights.canEditActivity()).to.be.true();
  });

  it('allows activity editing for SoCraTes-Admins', function () {
    conf.addProperties({socratesAdmins: ['memberId']});

    loginAs('memberId');
    expect(res.locals.accessrights.canEditActivity()).to.be.true();

    conf.addProperties({socratesAdmins: []});
  });

  describe('tells if the current user needs to pay', function () {
    beforeEach(function () {
      loginAs('memberId');
    });

    it('yes, if he is subscribed and has not paid', function () {
      socrates.resources = function () {return {resourceNamesOf: function () { return ['name1']; }}; };
      req.user.subscriber = {needsToPay: function () { return true; }};

      expect(res.locals.accessrights.needsToPay()).to.be.true();
    });

    it('no, if he is not really subscribed (-> waitinglist) and has not paid', function () {
      socrates.resources = function () {return {resourceNamesOf: function () { return []; }}; };
      req.user.subscriber = {needsToPay: function () { return true; }};

      expect(res.locals.accessrights.needsToPay()).to.be.false();
    });

    it('no, if he has paid', function () {
      socrates.resources = function () {return {resourceNamesOf: function () { return ['name']; }}; };
      req.user.subscriber = {needsToPay: function () { return false; }};

      expect(res.locals.accessrights.needsToPay()).to.be.false();
    });

    it('no, if there is no subscriber at all', function () {
      socrates.resources = function () {return {resourceNamesOf: function () { return []; }}; };

      expect(res.locals.accessrights.needsToPay()).to.be.false();
    });
  });
});
