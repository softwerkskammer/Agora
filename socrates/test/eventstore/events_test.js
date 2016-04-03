'use strict';

var moment = require('moment-timezone');
var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');
var events = beans.get('events');

describe('The socrates events', function () {
  it('have a unix offset', function () {

    var now = moment();
    var event = events.roomQuotaWasSet('bedroom-format', 100);

    expect(moment(event.timestamp).isSameOrAfter(now)).to.be.true();
    expect(moment(event.timestamp).isSameOrBefore(now.add(1, 'seconds'))).to.be.true();
  });
});
