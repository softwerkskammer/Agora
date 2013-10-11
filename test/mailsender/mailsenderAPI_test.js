"use strict";

var expect = require('chai').expect;
var sinon = require('sinon').sandbox.create();
var beans = require('../configureForTest').get('beans');
//var Message = beans.get('message');

var membersAPI = beans.get('membersAPI');
var groupsAPI = beans.get('groupsAPI');
var activitiesAPI = beans.get('activitiesAPI');
//var groupsAndMembersAPI = beans.get('groupsAndMembersAPI');

var api = beans.get('mailsenderAPI');

describe('MailsenderAPI', function () {
  var activityURL = 'acti_vi_ty';
  var nickname = 'nickyNamy';

  beforeEach(function (done) {
    var availableGroups = [];
    sinon.stub(groupsAPI, 'getAllAvailableGroups', function (callback) { callback(null, availableGroups); });
    sinon.stub(activitiesAPI, 'getActivity', function (activityURL, callback) {
      callback(null, {markdown: function () {} });
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

});

