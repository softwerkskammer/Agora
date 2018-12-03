'use strict';
const expect = require('must-dist');

const conf = require('../../testutil/configureForTest');
const beans = conf.get('beans');
const bodyToGroup = beans.get('groupMapper').bodyToGroup;

describe('Group Mapper (bodyToGroup)', () => {
  let body;

  beforeEach(() => {
    body = {
      id: 'any-group-id',
      contactTheOrganizers: 'on'
    };
  });

  function organizerDidNotSelectCheckbox() {
    delete body.contactTheOrganizers;
  }

  function organizerSelectedCheckbox() {
    body.contactTheOrganizers = 'on';
  }

  function somebodySendingBogusData() {
    body.contactTheOrganizers = 'anything-else-but on';
  }

  it('no contactTheOrganizers property it was not checked', () => {
    organizerDidNotSelectCheckbox();
    expect(bodyToGroup(body).contactTheOrganizers).to.be(false);
  });

  it('fall back to disabled if contactTheOrganizers property has bogus value', () => {
    somebodySendingBogusData();
    expect(bodyToGroup(body).contactTheOrganizers).to.be(false);
  });

  it('contactTheOrganizers property with value on it was checked', () => {
    organizerSelectedCheckbox();
    expect(bodyToGroup(body).contactTheOrganizers).to.be(true);
  });
});
