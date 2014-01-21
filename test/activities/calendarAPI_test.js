"use strict";

var expect = require('chai').expect;

var beans = require('../configureForTest').get('beans');

var calendarAPI = beans.get('calendarAPI');
var fieldHelpers = beans.get('fieldHelpers');
var Activity = beans.get('activity');

describe('Calendar API', function () {

  it('converts a wellformed Activity to a calendar display event without colors given', function () {
    var activity = new Activity({
      title: 'Title',
      startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('04.04.2013'),
      endUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('05.04.2013'),
      url: 'myURL'
    });
    var event = calendarAPI.asCalendarEvent(activity);
    expect('Title').to.equal(event.title);
    expect(4).to.equal(event.dayOfWeek);
    expect('/activities/myURL').to.equal(event.url);
    expect('#353535').to.equal(event.color);
  });

});
