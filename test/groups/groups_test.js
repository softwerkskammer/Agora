"use strict";

var request = require('supertest');
var sinon = require('sinon');
var conf = require('../configureForTest');

var groupsPersistence = conf.get('beans').get('groupsPersistence');
var membersPersistence = conf.get('beans').get('membersPersistence');
var sympa = conf.get('beans').get('sympaStub');

var app = require('../../app')().create();

describe('Groups application', function () {

  before(function (done) {
    sinon.stub(sympa, 'getAllAvailableLists', function (callback) {
      return callback(null, ['GroupA']);
    });

    sinon.stub(groupsPersistence, 'listByIds', function (list, sortOrder, callback) {
      if (list[0] === 'GroupA') {
        return callback(null, [
          {id: 'GroupA', longName: 'Gruppe A', description: 'Dies ist Gruppe A.', type: 'Themengruppe', emailPrefix: 'Group-A'}
        ]);
      }
      return callback(null, []);
    });

    sinon.stub(groupsPersistence, 'getById', function (list, callback) {
      if (list.test('GroupA')) {
        return callback(null,
                        {id: 'GroupA', longName: 'Gruppe A', description: 'Dies ist Gruppe A.', type: 'Themengruppe', emailPrefix: 'Group-A'});
      }
      return callback(null, null);
    });

    done();
  });

  after(function (done) {
    sympa.getAllAvailableLists.restore();
    groupsPersistence.listByIds.restore();
    groupsPersistence.getById.restore();
    done();
  });

  it('shows all available lists', function (done) {
    request(app)
      .get('/groups/')
      .expect(200)
      .expect('Content-Type', /text\/html/)
      .expect(/Gruppen/)
      .expect(/Gruppe A/, done);
  });

  it('returns false for checkgroupname when the group name already exists', function (done) {
    request(app)
    .get('/groups/checkgroupname?id=GroupA')
    .expect(200)
    .expect(/false/, done);
  });

  it('returns true for checkgroupname when the group name does not exist', function (done) {
    request(app)
    .get('/groups/checkgroupname?id=UnknownGroup')
    .expect(200)
    .expect(/true/, done);
  });

  it('allows dashes and underscores in the groupname', function (done) {
    request(app)
    .get('/groups/checkgroupname?id=Un_known-Group')
    .expect(200)
    .expect(/true/, done);
  });

  it('displays an existing group and membercount', function (done) {

    sinon.stub(sympa, 'getUsersOfList', function (groupname, callback) {
      if (groupname === 'GroupA') {
        return callback(['peter@google.de', 'hans@aol.com']);
      }
    });
    sinon.stub(membersPersistence, 'listByEMails', function (emails, sortOrder, callback) {
      return callback(null, [
        { firstname: 'Hans', lastname: 'Dampf' },
        { firstname: 'Peter', lastname: 'Meyer' }
      ]);
    });

    request(app)
      .get('/groups/GroupA')
      .expect(200)
      .expect('Content-Type', /text\/html/)
      .expect(/Gruppe A<\/title>/)
      .expect(/Dies ist Gruppe A./)
      .expect(/Themengruppe/)
      .expect(/Mitglieder:/)
      .expect(/Diese Gruppe hat 2 Mitglieder/, function (err) {
        sympa.getUsersOfList.restore();
        membersPersistence.listByEMails.restore();
        done(err);
      });
  });
});
