'use strict';

var request = require('supertest');
var sinon = require('sinon').sandbox.create();

var conf = require('../../testutil/configureForTest');
var beans = conf.get('beans');

var socratesActivitiesService = beans.get('socratesActivitiesService');
var SoCraTesActivity = beans.get('socratesActivityExtended');
var Member = beans.get('member');
var Participation = beans.get('socratesParticipation');

var app = require('../../testutil/testHelper')('socratesWikiApp').createApp({id: 'userid'});

describe('SoCraTes wiki application', function () {
  var socratesActivity = new SoCraTesActivity({});

  beforeEach(function () {
    sinon.stub(socratesActivitiesService, 'getActivityWithParticipantsAndSubscribers', function (year, callback) {
      callback(null, socratesActivity);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('lists the participants', function () {
    it('by showing one participant with one answer', function (done) {
      var member = new Member({nickname: 'nick', firstname: 'first', lastname: 'last'});
      member.participation = new Participation();
      member.participation.state.question1 = 'Relation to SC';
      socratesActivity.participants = [member];
      request(app)
        .get('/someYear/participantsOverview')
        .expect(/<h4><a href="\/members\/nick">first last/)
        .expect(/<h5>What is your relation to Software Craftsmanship?/)
        .expect(/<p>Relation to SC/)
        .expect(200, done);
    });
  });

});
