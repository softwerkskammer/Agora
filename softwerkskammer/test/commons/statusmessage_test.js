'use strict';

const statusmessage = require('../../testutil/configureForTest').get('beans').get('statusmessage');
const expect = require('must-dist');

describe('Statusmessage', () => {

  it('has type "danger" when created as error', () => {
    const session = {};
    statusmessage.errorMessage('', '').putIntoSession({session: session});
    expect(session.statusmessage.type).to.equal('alert-danger');
  });

  it('has type "success" when created as success', () => {
    const session = {};
    statusmessage.successMessage('', '').putIntoSession({session: session});
    expect(session.statusmessage.type).to.equal('alert-success');
  });

  it('is in res when recreated from object', () => {
    const locals = {};
    statusmessage.fromObject({type: 'alert-success'}).putIntoSession({session: {}}, {locals: locals});
    expect(locals.statusmessage.contents().type).to.equal('alert-success');
  });

});
