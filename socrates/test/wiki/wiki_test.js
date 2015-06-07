'use strict';

var request = require('supertest');
var sinon = require('sinon').sandbox.create();

var conf = require('../../testutil/configureForTest');
var beans = conf.get('beans');

var socratesActivitiesService = beans.get('socratesActivitiesService');
var SoCraTesActivity = beans.get('socratesActivityExtended');
var Member = beans.get('member');
var Participation = beans.get('socratesParticipation');

var createApp = require('../../testutil/testHelper')('socratesWikiApp').createApp;

describe('SoCraTes wiki application', function () {

  beforeEach(function () {
    sinon.stub(socratesActivitiesService, 'getActivityWithParticipantsAndSubscribers', function (year, callback) {
      var socratesActivity = new SoCraTesActivity({});
      var member = new Member({id: 'userid', nickname: 'nick', firstname: 'first', lastname: 'last'});
      member.participation = new Participation({question1: 'Relation to SC'});
      socratesActivity.participants = [member];
      callback(null, socratesActivity);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  describe.only('lists the participants', function () {
    it('and shows no editing option for anybody', function (done) {
      request(createApp({id: 'anybody'}))
        .get('/someYear/participantsOverview')
        .expect(/<h4><a href="\/members\/nick">first last/)
        .expect(/<h5><em>What is your relation to Software Craftsmanship?/)
        .expect(/<p>Relation to SC/)
        .expect(200, done);
    });
    it('and shows an editing option for the current user', function (done) {
      request(createApp({id: 'userid'}))
        .get('/someYear/participantsOverview')
        .expect(/<h4><div class="btn-group"><a href="\/members\/editForParticipantListing" title="Edit" class="btn btn-primary"><i class="fa fa-edit fa-fw"><\/i> first last/)
        .expect(/<h5><em>What is your relation to Software Craftsmanship?/)
        .expect(/<p>Relation to SC/)
        .expect(200, done);
    });
  });

});
