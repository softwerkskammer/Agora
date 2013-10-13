"use strict";

require('../configureForTest');
var conf = require('nconf');
var expect = require('chai').expect;

var Activity = conf.get('beans').get('activity');

describe('Activity', function () {
  it('converts a wellformed Activity to a calendar display event without colors given', function (done) {
    var activity = new Activity().fillFromDB({
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
    var activity = new Activity().fillFromDB({
      url: 'myURL',
      assignedGroup: 'group'
    });
    var groups = [
      {id: 'group', longName: 'groupname'},
      {id: 'other', longName: 'othername'}
    ];
    var groupName = activity.groupNameFrom(groups);
    expect('groupname').to.equal(groupName);
    done();
  });

  it('fetches a blank string if group not found', function (done) {
    var activity = new Activity().fillFromDB({
      url: 'myURL',
      assignedGroup: 'group'
    });
    var groups = [
      {id: 'each', longName: 'groupname'},
      {id: 'other', longName: 'othername'}
    ];
    var groupName = activity.groupNameFrom(groups);
    expect('').to.equal(groupName);
    done();
  });

  it('retrieves the color from the assigned group', function (done) {
    var activity = new Activity().fillFromDB({
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
    var activity = new Activity().fillFromDB({
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
    var activity = new Activity().fillFromDB({
      url: 'myURL'
    });
    var color = activity.colorFrom(null, []);
    expect('#353535').to.equal(color);
    done();
  });

  it('parses start date and time using default timezone', function () {
    var activity = new Activity().fillFromDB({
      url: 'myURL',
      startDate: '01.02.2013',
      startTime: '12:34'
    });
    expect(activity.startDate()).to.equal('01.02.2013');
    expect(activity.startTime()).to.equal('12:34');
    expect(activity.startMoment().format()).to.equal('2013-02-01T12:34:00+01:00');
  });

  it('parses end date and time using default timezone', function () {
    var activity = new Activity().fillFromDB({
      url: 'myURL',
      endDate: '01.08.2013',
      endTime: '12:34'
    });
    expect(activity.endDate()).to.equal('01.08.2013');
    expect(activity.endTime()).to.equal('12:34');
    expect(activity.endMoment().format()).to.equal('2013-08-01T12:34:00+02:00');
  });
});

describe('Activity\'s description', function () {
  it('renders anchor tags when required', function (done) {
    var activity = new Activity();
    activity.description = '[dafadf](http://a.de) https://b.de';
    expect(activity.descriptionHTML()).to.contain('a href="http://a.de"');
    expect(activity.descriptionHTML()).to.contain('"https://b.de"');
    done();
  });

  it('removes anchor tags when required', function (done) {
    var activity = new Activity();
    activity.description = '<a href = "http://a.de">dafadf</a> https://b.de';
    expect(activity.descriptionPlain()).to.not.contain('"http://a.de"');
    expect(activity.descriptionPlain()).to.not.contain('"https://b.de"');
    expect(activity.descriptionPlain()).to.contain('dafadf');
    expect(activity.descriptionPlain()).to.contain('https://b.de');
    done();
  });
});

describe('Activity\'s direction', function () {
  it('knows that it doesn\'t contain direction', function (done) {
    var activity = new Activity();
    activity.direction = '';
    expect(activity.hasDirection()).to.be.false;
    done();
  });

  it('knows that it contains direction', function (done) {
    var activity = new Activity();
    activity.direction = 'direction';
    expect(activity.hasDirection()).to.be.true;
    done();
  });
});

describe('Activity\'s markdown', function () {
  it('creates its markdown with direction', function (done) {
    var activity = new Activity().fillFromDB({
      url : 'url',
      description : 'description',
      location : 'location',
      direction : 'direction',
      startDate : '4.5.2013',
      startTime : '12:21'
    });
    var markdown = activity.markdown();
    expect(markdown).to.contain('description');
    expect(markdown).to.contain('04.05.2013');
    expect(markdown).to.contain('12:21');
    expect(markdown).to.contain('location');
    expect(markdown).to.contain('Wegbeschreibung');
    expect(markdown).to.contain('direction');
    done();
  });

  it('creates its markdown without direction', function (done) {
    var activity = new Activity().fillFromDB({
      url : 'url',
      description : 'description',
      location : 'location',
      direction : '',
      startDate : '4.5.2013',
      startTime : '12:21'
    });
    expect(activity.markdown()).to.not.contain('Wegbeschreibung');
    done();
  });
});

describe('Activity stores a list of members', function () {
  it('can add a member', function (done) {
    var activity = new Activity();
    activity.addMemberId('memberID');
    expect(activity.registeredMembers()).to.contain('memberID');
    done();
  });

  it('can remove a registered member', function (done) {
    var activity = new Activity().fillFromDB(
      {url: 'myURL', registeredMembers: ['memberID']}
    );
    activity.removeMemberId('memberID');
    expect(activity.registeredMembers()).to.be.empty;
    done();
  });

  it('resets for copied activity', function (done) {
    var activity = new Activity().fillFromDB({
      id: 'ID',
      title: 'Title',
      startDate: '4.4.2013',
      endDate: '5.4.2013',
      url: 'myURL',
      registeredMembers: ['memberID']
    });
    activity = activity.resetForClone();
    expect(activity.registeredMembers()).to.be.empty;
    expect(activity.startDate()).to.not.equal('04.04.2013');
    expect(activity.endDate()).to.not.equal('05.04.2013');
    expect(activity.id).to.be.null;
    expect(activity.url).to.be.null;
    done();
  });

  it('copies a registered member from an existing activity', function (done) {
    // this constructor behaviour also affects loading of stored activities
    var activity = new Activity().fillFromDB({url: 'url'});
    activity.addMemberId('memberID');
    var copy = new Activity().fillFromDB(activity);
    expect(copy.registeredMembers()).to.contain('memberID');
    done();
  });

});

describe('ICalendar', function () {
  var activity = new Activity().fillFromDB({
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
