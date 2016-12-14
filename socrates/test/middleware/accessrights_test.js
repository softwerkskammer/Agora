'use strict';

const expect = require('must-dist');
const sinon = require('sinon').sandbox.create();

const conf = require('../../testutil/configureForTest');
const beans = conf.get('beans');
const accessrights = beans.get('accessrights');

describe('accessrights', () => {

  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {};
    res = {locals: {}};
    next = () => { return; };

    accessrights(req, res, next);
  });

  afterEach(() => {
    sinon.restore();
  });

  function loginAs(memberId) {
    req.user = {member: {id: () => memberId}};
  }

  it('does not allow activity editing if nobody is logged in', () => {
    expect(res.locals.accessrights.canEditActivity()).to.be.false();
  });

  it('does not allow activity editing for non-superusers', () => {
    loginAs('memberId');
    expect(res.locals.accessrights.canEditActivity()).to.be.false();
  });

  it('allows activity editing for superusers', () => {
    loginAs('superuserID');
    expect(res.locals.accessrights.canEditActivity()).to.be.true();
  });

  it('allows activity editing for SoCraTes-Admins', () => {
    conf.addProperties({socratesAdmins: ['memberId']});

    loginAs('memberId');
    expect(res.locals.accessrights.canEditActivity()).to.be.true();

    conf.addProperties({socratesAdmins: []});
  });

});
