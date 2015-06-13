'use strict';

var expect = require('must-dist');
var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTest').get('beans');

var calendarService = beans.get('calendarService');
var fieldHelpers = beans.get('fieldHelpers');
var Activity = beans.get('activity');
var activitystore = beans.get('activitystore');

describe('Calendar Service', function () {
  var start = fieldHelpers.parseToMomentUsingDefaultTimezone('01.04.2013');
  var end = fieldHelpers.parseToMomentUsingDefaultTimezone('01.05.2013');
  var activity = new Activity({
    title: 'Title',
    startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('04.04.2013'),
    endUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('05.04.2013'),
    url: 'myURL'
  });

  before(function () {
    sinon.stub(activitystore, 'allActivitiesByDateRangeInAscendingOrder', function (rangeFrom, rangeTo, callback) {
      callback(null, [activity]);
    });
  });

  it('loads and converts a wellformed Activity to a calendar display event without colors given', function (done) {
    calendarService.eventsBetween(start, end, null, function (err, activities) {
      expect(activities).to.have.length(1);
      var event = activities[0];
      expect('Title').to.equal(event.title);
      expect('2013-04-04T00:00:00+02:00').to.equal(event.start); // includes timezone offset!
      expect(event.url).to.match('/activities/myURL$');
      expect('#353535').to.equal(event.color);
      done(err);
    });
  });

});
