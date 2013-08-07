"use strict";

require('../configureForTest');
var conf = require('nconf');
var expect = require('chai').expect;
var moment = require('moment');

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

  it('parses start date and time using UTC', function (done) {
    var activity = new Activity({
      url: 'myURL',
      startDate: '01.02.2013',
      startTime: '12:34'
    });
    expect(activity.startUnix).to.equal(moment.utc('2013-02-01 12:34').unix());
    done();
  });

  it('parses end date and time using UTC', function (done) {
    var activity = new Activity({
      url: 'myURL',
      endDate: '01.02.2013',
      endTime: '12:34'
    });
    expect(activity.endUnix).to.equal(moment.utc('2013-02-01 12:34').unix());
    done();
  });
});

describe('Activity stores a list of members', function () {
  it('can add a member', function (done) {
    var activity = new Activity();
    activity.addMemberId('memberID');
    expect(activity.registeredMembers).to.not.be.empty;
    done();
  });

  it('does not add a member twice', function (done) {
    var activity = new Activity(
      {url: 'myURL', registeredMembers: ['memberID']}
    );
    activity.addMemberId('memberID');
    expect(1).to.equal(activity.registeredMembers.length);
    done();
  });

  it('can remove a registered member', function (done) {
    var activity = new Activity(
      {url: 'myURL', registeredMembers: ['memberID']}
    );
    activity.removeMemberId('memberID');
    expect(activity.registeredMembers).to.be.empty;
    done();
  });

  it('can remove a non registered member', function (done) {
    var activity = new Activity(
      {url: 'myURL', registeredMembers: ['memberID']}
    );
    activity.removeMemberId('notRegisteredID');
    expect(activity.registeredMembers).to.not.be.empty;
    done();
  });

  it('can remove even when not initialized', function (done) {
    var activity = new Activity();
    activity.removeMemberId('notRegisteredID');
    expect(activity.registeredMembers).to.be.empty;
    done();
  });

});

describe('ICalendar', function () {
  var activity = new Activity({
    title: 'Title',
    startDate: '4.4.2013',
    startTime: '17:00',
    endTime: '18:00',
    endDate: '5.4.2013',
    url: 'myURL',
    description: 'foo',
    location: 'bar'
  });

  it('start date conversion', function () {
    expect(activity.asICal().toString()).to.match(/DTSTART:20130404T150000Z/);
  });

  it('end date conversion', function () {
    expect(activity.asICal().toString()).to.match(/DTEND:20130405T160000Z/);
  });

  it('render description', function () {
    expect(activity.asICal().toString()).to.match(/DESCRIPTION:foo/);
  });

  it('render location', function () {
    expect(activity.asICal().toString()).to.match(/LOCATION:bar/);
  });
});
