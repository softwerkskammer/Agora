'use strict';

var moment = require('moment-timezone');
var expect = require('must');
var _ = require('lodash');

var beans = require('../../testutil/configureForTest').get('beans');
var Resource = beans.get('resource');
var SoCraTesResource = beans.get('socratesResource');

var tomorrow = moment();
tomorrow.add(1, 'days');

describe('SoCraTesResource', function () {
  it('adds the expiration time to a registered member', function () {
    var resource = new Resource({
      _registrationOpen: true,
      _registeredMembers: [
        {memberId: 'memberID'}
      ]
    });
    var socratesResource = new SoCraTesResource(resource);

    socratesResource.addExpirationTimeFor('memberID');

    var expirationTime = socratesResource.state._registeredMembers[0].expiresAt;
    expect(expirationTime).to.exist();
    expect(moment(expirationTime).isBetween(moment().add(29, 'minutes'), moment().add(31, 'minutes'))).to.be(true);
  });
});
