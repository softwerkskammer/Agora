'use strict';

const moment = require('moment-timezone');
const expect = require('must-dist');

const beans = require('../../testutil/configureForTest').get('beans');
const events = beans.get('events');

describe('The socrates events', () => {
  it('have a unix offset', () => {

    const now = moment();
    const event = events.roomQuotaWasSet('bedroom-format', 100);

    expect(moment(event.timestamp).isSameOrAfter(now)).to.be.true();
    expect(moment(event.timestamp).isSameOrBefore(now.add(1, 'seconds'))).to.be.true();
  });
});
