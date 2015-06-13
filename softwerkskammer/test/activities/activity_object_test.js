'use strict';

var expect = require('must-dist');

var Activity = require('../../testutil/configureForTest').get('beans').get('activity');

// TODO Activity.fillFromUI with null/undefined in startDate, startTime, endDate, endTime

describe('Activity', function () {
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
    expect(activity.hasDirection()).to.be(false);
  });

  it('knows that it contains direction', function () {
    var activity = new Activity({
      direction: 'direction'
    });
    expect(activity.hasDirection()).to.be(true);
  });
});

describe('Activity\'s editorIds', function () {
  it('returns an empty array if there are no editors in constructor object', function () {
    var activity = new Activity();
    expect(activity.editorIds()).to.eql([]);
  });

  it('returns the editorIds that are contained in constructor object', function () {
    var activity = new Activity({
      editorIds: ['abc', 'def']
    });
    expect(activity.editorIds()).to.eql(['abc', 'def']);
  });

  it('returns an empty array if there are no editorIds passed via fillFromUI', function () {
    var activity = new Activity();
    activity.fillFromUI({});
    expect(activity.editorIds()).to.eql([]);
  });

  it('returns the editorIds that are passed via fillFromUI', function () {
    var activity = new Activity();
    activity.fillFromUI({}, ['abc', 'def']);
    expect(activity.editorIds()).to.eql(['abc', 'def']);
  });
});
