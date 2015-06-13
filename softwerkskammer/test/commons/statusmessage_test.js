'use strict';

var statusmessage = require('../../testutil/configureForTest').get('beans').get('statusmessage');
var expect = require('must-dist');

describe('Statusmessage', function () {

  it('has type "danger" when created as error', function () {
    var session = {};
    statusmessage.errorMessage('', '').putIntoSession({session: session});
    expect(session.statusmessage.type).to.equal('alert-danger');
  });

  it('has type "success" when created as success', function () {
    var session = {};
    statusmessage.successMessage('', '').putIntoSession({session: session});
    expect(session.statusmessage.type).to.equal('alert-success');
  });

  it('is in res when recreated from object', function () {
    var locals = {};
    statusmessage.fromObject({type: 'alert-success'}).putIntoSession({session: {}}, {locals: locals});
    expect(locals.statusmessage.contents().type).to.equal('alert-success');
  });

});
