'use strict';

var expect = require('must-dist');
var sinon = require('sinon').sandbox.create();

var conf = require('../../testutil/configureForTest');
var beans = conf.get('beans');
var accessrights = beans.get('accessrights');

describe('accessrights', function () {

  var req;
  var res;
  var next;

  beforeEach(function () {
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

});
