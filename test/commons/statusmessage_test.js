"use strict";

var conf = require('../configureForTest');
var statusmessage = conf.get('beans').get('statusmessage');
var expect = require('chai').expect;

describe('Statusmessage', function () {
  
  it('has type "danger" when created as error', function () {
    var session = {};
    statusmessage.errorMessage({session: session}, '', '');
    expect(session.statusmessage.type).to.equal('alert-danger');
  });
  
  it('has type "success" when created as success', function () {
    var session = {};
    statusmessage.successMessage({session: session}, '', '');
    expect(session.statusmessage.type).to.equal('alert-success');
  });
  
  it('is in res when recreated from object', function () {
    var locals = {};
    statusmessage.fromObject({type: 'alert-success'}, {session: {}}, {locals: locals});
    expect(locals.statusmessage.type).to.equal('alert-success');
  });
  
});
