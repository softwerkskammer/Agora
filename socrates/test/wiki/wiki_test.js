'use strict';

var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');

var conf = require('../../testutil/configureForTest');
var beans = conf.get('beans');

var activityParticipantService = beans.get('activityParticipantService');
var Member = beans.get('member');
var Participation = beans.get('socratesParticipation');

var createApp = require('../../testutil/testHelper')('socratesWikiApp').createApp;

describe('SoCraTes wiki application', function () {

  beforeEach(function () {

    sinon.stub(activityParticipantService, 'getParticipantsFor', function (year, callback) {
      var member = new Member({id: 'userid', nickname: 'nick', firstname: 'first', lastname: 'last'});
      member.participation = new Participation({question1: 'Relation to SC'});
      callback(null, [member]);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('lists the participants', function () {
    it('and shows no editing option for anybody but shows the questions in 2015', function (done) {
      request(createApp({id: 'anybody'}))
        .get('/2015/participantsOverview')
        .expect(/<h4><a href="\/members\/nick">first last/)
        .expect(/<h5><em>What is your relation to Software Craftsmanship?/)
        .expect(/<p>Relation to SC/)
        .expect(200, done);
    });
    it('and shows no editing option for anybody and does not show the questions in 2016', function (done) {
      request(createApp({id: 'anybody'}))
        .get('/2016/participantsOverview')
        .expect(/<h4><a href="\/members\/nick">first last/)
        .expect(200, function (err, res) {
          expect(res.text).to.not.contain('What is your relation to Software Craftsmanship?');
          done(err);
        });
    });
    it('and shows an editing option for the current user', function (done) {
      request(createApp({id: 'userid'}))
        .get('/2016/participantsOverview')
        .expect(/<h4><div class="btn-group"><a href="\/members\/editForParticipantListing" title="Edit" class="btn btn-primary"><i class="fa fa-edit fa-fw"><\/i> first last/)
        .expect(200, done);
    });
  });

});
