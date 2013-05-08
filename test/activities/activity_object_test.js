"use strict";

require('../configureForTest');
var conf = require('nconf');
var expect = require('chai').expect;

var Activity = conf.get('beans').get('activity');

describe('Activity', function () {
  it('converts a wellformed Activity to a calendar display event without colors given', function (done) {
    var activity = new Activity({
      title: 'Title',
      startDate: '4.4.2013',
      endDate: '5.4.2013',
      url: 'myURL'
    });
    var event = activity.asCalendarEvent();
    expect('Title').to.equal(event.title);
    expect(4).to.equal(event.dayOfWeek);
    expect('/activities/myURL').to.equal(event.url);
    expect('#353535').to.equal(event.color);
    expect(86400).to.equal(event.end - event.start);
    done();
  });

  it('fetches the group long name', function (done) {
    var activity = new Activity({
      url: 'myURL',
      assignedGroup: 'group'
    });
    var groups = [
      {id: 'group', longName: 'groupname'},
      {id: 'other', longName: 'othername'}
    ];
    var groupName = activity.groupName(groups);
    expect('groupname').to.equal(groupName);
    done();
  });

  it('fetches a blank string if group not found', function (done) {
    var activity = new Activity({
      url: 'myURL',
      assignedGroup: 'group'
    });
    var groups = [
      {id: 'each', longName: 'groupname'},
      {id: 'other', longName: 'othername'}
    ];
    var groupName = activity.groupName(groups);
    expect('').to.equal(groupName);
    done();
  });

  it('retrieves the color from the assigned group', function (done) {
    var activity = new Activity({
      url: 'myURL',
      assignedGroup: 'group',
      color: 'aus Gruppe'
    });
    var groupColors = {
      group: '#FFF',
      other: '000'
    };
    var color = activity.colorFrom(groupColors, []);
    expect('#FFF').to.equal(color);
    done();
  });

  it('retrieves the color from the assigned color', function (done) {
    var activity = new Activity({
      url: 'myURL',
      color: 'special'
    });
    var colors = [
      {id: 'special', color: '#FFF' },
      {id: 'normal', color: '#00' }
    ];
    var color = activity.colorFrom(null, colors);
    expect('#FFF').to.equal(color);
    done();
  });

  it('retrieves the color as default if not found', function (done) {
    var activity = new Activity({
      url: 'myURL'
    });
    var color = activity.colorFrom(null, []);
    expect('#353535').to.equal(color);
    done();
  });

});
