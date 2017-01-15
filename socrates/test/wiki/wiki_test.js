'use strict';

const request = require('supertest');
const sinon = require('sinon').sandbox.create();
const expect = require('must-dist');

const conf = require('../../testutil/configureForTest');
const beans = conf.get('beans');

const activityParticipantService = beans.get('activityParticipantService');
const Member = beans.get('member');
const Participation = beans.get('socratesParticipation');

const createApp = require('../../testutil/testHelper')('socratesWikiApp').createApp;

describe('SoCraTes wiki application', () => {

  beforeEach(() => {

    sinon.stub(activityParticipantService, 'getParticipantsFor', (year, callback) => {
      const member = new Member({id: 'userid', nickname: 'nick', firstname: 'first', lastname: 'last'});
      member.participation = new Participation({question1: 'Relation to SC'});
      callback(null, [member]);
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('lists the participants', () => {
    it('and shows no editing option for anybody but shows the questions in 2015', done => {
      request(createApp({id: 'anybody'}))
        .get('/2015/participantsOverview')
        .expect(/<h4><a href="\/members\/nick">first last/)
        .expect(/<h5><em>What is your relation to Software Craftsmanship?/)
        .expect(/<p>Relation to SC/)
        .expect(200, done);
    });
    it('and shows no editing option for anybody and does not show the questions in 2016', done => {
      request(createApp({id: 'anybody'}))
        .get('/2016/participantsOverview')
        .expect(/<a href="\/members\/nick">nick/)
        .expect(/first last/)
        .expect(200, (err, res) => {
          expect(res.text).to.not.contain('What is your relation to Software Craftsmanship?');
          done(err);
        });
    });
    it('and shows an editing option for the current user in 2015', done => {
      request(createApp({id: 'userid'}))
        .get('/2015/participantsOverview')
        .expect(/<h4><div class="btn-group"><a class="btn btn-primary" href="\/members\/editForParticipantListing" title="Edit"><i class="fa fa-edit fa-fw"><\/i> first last/)
        .expect(200, done);
    });
  });

});
