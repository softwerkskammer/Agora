"use strict";

require('../configureForTest');
var conf = require('nconf');
var expect = require('chai').expect;

var fieldHelpers = conf.get('beans').get('fieldHelpers');
var Activity = conf.get('beans').get('activity');

// TODO Activity.fillFromUI with null/undefined in startDate, startTime, endDate, endTime

describe('Activity', function () {
  it('converts a wellformed Activity to a calendar display event without colors given', function () {
    var activity = new Activity({
      title: 'Title',
      startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('04.04.2013'),
      endUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('05.04.2013'),
      url: 'myURL'
    });
    var event = activity.asCalendarEvent();
    expect('Title').to.equal(event.title);
    expect(4).to.equal(event.dayOfWeek);
    expect('/activities/myURL').to.equal(event.url);
    expect('#353535').to.equal(event.color);
  });

  it('fetches the group long name', function () {
    var activity = new Activity({
      url: 'myURL',
      assignedGroup: 'group'
    });
    var groups = [
      {id: 'group', longName: 'groupname'},
      {id: 'other', longName: 'othername'}
    ];
    activity.groupFrom(groups);
    expect(activity.groupName()).to.equal('groupname');
  });

  it('fetches a blank string if group not found', function () {
    var activity = new Activity({
      url: 'myURL',
      assignedGroup: 'group'
    });
    var groups = [
      {id: 'each', longName: 'groupname'},
      {id: 'other', longName: 'othername'}
    ];
    activity.groupFrom(groups);
    expect(activity.groupName()).to.equal('');
  });

  it('retrieves the color from the assigned group', function () {
    var activity = new Activity({
      url: 'myURL',
      assignedGroup: 'group'
    });
    var groupColors = {
      group: '#FFF',
      other: '000'
    };
    expect(activity.colorFrom(groupColors)).to.equal('#FFF');
  });

  it('retrieves the default color if the group is not present in the group colors', function () {
    var activity = new Activity({
      url: 'myURL',
      assignedGroup: 'group'
    });
    var groupColors = {
      other: '000'
    };
    expect(activity.colorFrom(groupColors)).to.equal('#353535');
  });

  it('retrieves the color as default if no group colors are found', function () {
    var activity = new Activity({
      url: 'myURL'
    });
    expect(activity.colorFrom(null)).to.equal('#353535');
  });

  it('parses start date and time using default timezone', function () {
    var activity = new Activity().fillFromUI({
      url: 'myURL',
      startDate: '01.02.2013',
      startTime: '12:34'
    });
    expect(activity.startDate()).to.equal('01.02.2013');
    expect(activity.startTime()).to.equal('12:34');
    expect(activity.startMoment().format()).to.equal('2013-02-01T12:34:00+01:00');
  });

  it('parses end date and time using default timezone', function () {
    var activity = new Activity().fillFromUI({
      url: 'myURL',
      endDate: '01.08.2013',
      endTime: '12:34'
    });
    expect(activity.endDate()).to.equal('01.08.2013');
    expect(activity.endTime()).to.equal('12:34');
    expect(activity.endMoment().format()).to.equal('2013-08-01T12:34:00+02:00');
  });
});

describe('Activity\'s owner', function () {
  it('is preserved in existing state if not given to constructor', function () {
    var activity = new Activity({ owner: 'owner' });
    expect(activity.owner()).to.equal('owner');
  });
});

describe('Activity\'s description', function () {
  it('renders anchor tags when required', function () {
    var activity = new Activity({
      description: '[dafadf](http://a.de) https://b.de'
    });
    expect(activity.descriptionHTML()).to.contain('a href="http://a.de"');
    expect(activity.descriptionHTML()).to.contain('"https://b.de"');
  });

  it('removes anchor tags when required', function () {
    var activity = new Activity({
      description: '<a href = "http://a.de">dafadf</a> https://b.de'
    });
    expect(activity.descriptionPlain()).to.not.contain('"http://a.de"');
    expect(activity.descriptionPlain()).to.not.contain('"https://b.de"');
    expect(activity.descriptionPlain()).to.contain('dafadf');
    expect(activity.descriptionPlain()).to.contain('https://b.de');
  });
});

describe('Activity\'s direction', function () {
  it('knows that it doesn\'t contain direction', function () {
    var activity = new Activity();
    expect(activity.hasDirection()).to.be.false;
  });

  it('knows that it contains direction', function () {
    var activity = new Activity({
      direction: 'direction'
    });
    expect(activity.hasDirection()).to.be.true;
  });
});
