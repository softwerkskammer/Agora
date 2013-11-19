"use strict";

var expect = require('chai').expect;
var sinon = require('sinon').sandbox.create();
var beans = require('../configureForTest').get('beans');
//var Message = beans.get('message');

var membersAPI = beans.get('membersAPI');
var groupsAPI = beans.get('groupsAPI');
var activitiesCoreAPI = beans.get('activitiesCoreAPI');
//var groupsAndMembersAPI = beans.get('groupsAndMembersAPI');

var api = beans.get('mailsenderAPI');
var Activity = beans.get('activity');
var fieldHelpers = beans.get('fieldHelpers');

var emptyActivity = new Activity({title: 'Title of the Activity', description: 'description1', assignedGroup: 'assignedGroup',
  location: 'location1', direction: 'direction1', startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013'), url: 'urlOfTheActivity' });


describe('MailsenderAPI', function () {
  var activityURL = 'acti_vi_ty';
  var nickname = 'nickyNamy';

  beforeEach(function (done) {
    var availableGroups = [];
    sinon.stub(groupsAPI, 'getAllAvailableGroups', function (callback) { callback(null, availableGroups); });
    sinon.stub(activitiesCoreAPI, 'getActivity', function (activityURL, callback) {
      callback(null, emptyActivity);
    });
    sinon.stub(membersAPI, 'getMember', function (nickname, callback) { callback(null, {}); });
    done();
  });

  afterEach(function (done) {
    sinon.restore();
    done();
  });

  it('collects data for showing the edit form for an activity', function (done) {
    api.dataForShowingMessageForActivity(activityURL, function (err, result) {
      expect(!!result.message).to.be.true;
      expect(!!result.regionalgroups).to.be.true;
      expect(!!result.themegroups).to.be.true;
      expect(result.successURL).to.contain(activityURL);
      done();
    });
  });

  it('collects data for showing the edit form for a member', function (done) {
    api.dataForShowingMessageToMember(nickname, function (err, result) {
      expect(!!result.message).to.be.true;
      expect(!!result.regionalgroups).to.be.false;
      expect(!!result.themegroups).to.be.false;
      expect(result.successURL).to.contain(nickname);
      done();
    });
  });

  it('creates the activity markdown with direction', function () {
    var activity = new Activity().fillFromUI({
      url: 'url',
      description: 'description',
      location: 'location',
      direction: 'direction',
      startDate: '4.5.2013',
      startTime: '12:21'
    });
    var markdown = api.activityMarkdown(activity);
    expect(markdown).to.contain('description');
    expect(markdown).to.contain('04.05.2013');
    expect(markdown).to.contain('12:21');
    expect(markdown).to.contain('location');
    expect(markdown).to.contain('Wegbeschreibung');
    expect(markdown).to.contain('direction');
  });

  it('creates the activity markdown without direction', function () {
    var activity = new Activity({
      url: 'url',
      description: 'description',
      location: 'location',
      direction: '',
      startDate: '4.5.2013',
      startTime: '12:21'
    });
    expect(api.activityMarkdown(activity)).to.not.contain('Wegbeschreibung');
  });

});


