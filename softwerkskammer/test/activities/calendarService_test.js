'use strict';

const expect = require('must-dist');
const sinon = require('sinon').createSandbox();

const beans = require('../../testutil/configureForTest').get('beans');

const calendarService = beans.get('calendarService');
const fieldHelpers = beans.get('fieldHelpers');
const Activity = beans.get('activity');
const activitystore = beans.get('activitystore');

describe('Calendar Service', () => {
  const start = fieldHelpers.parseToLuxonUsingDefaultTimezone('01.04.2013');
  const end = fieldHelpers.parseToLuxonUsingDefaultTimezone('01.05.2013');
  const activity = new Activity({
    title: 'Title',
    startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('04.04.2013'),
    endUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('05.04.2013'),
    url: 'myURL'
  });

  before(() => {
    sinon.stub(activitystore, 'allActivitiesByDateRangeInAscendingOrder').callsFake((rangeFrom, rangeTo, callback) => {
      callback(null, [activity]);
    });
  });

  it('loads and converts a wellformed Activity to a calendar display event without colors given', done => {
    calendarService.eventsBetween(start.toMillis(), end.toMillis(), null, (err, activities) => {
      expect(activities).to.have.length(1);
      const event = activities[0];
      expect('Title').to.equal(event.title);
      expect('2013-04-04T00:00:00+02:00').to.equal(event.start); // includes timezone offset!
      expect(event.url).to.match('/activities/myURL$');
      expect('#353535').to.equal(event.color);
      done(err);
    });
  });

});
