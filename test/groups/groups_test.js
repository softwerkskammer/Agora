/*global describe, it */
"use strict";
var request = require('supertest');
var express = require('express');
var sinon = require('sinon');
var conf = require('../configureForTest');

var groupsPersistence = conf.get('beans').get('groupsPersistence');
var membersPersistence = conf.get('beans').get('membersPersistence');
var sympa = conf.get('beans').get('sympaStub');

var app = conf.get('beans').get('groupsApp')(express());
app.locals({baseUrl: 'groups'});

describe('Groups application', function () {

  before(function (done) {
    sinon.stub(sympa, 'getAllAvailableLists', function (callback) {
      return callback(null, ['GroupA']);
    });
    sinon.stub(groupsPersistence, 'listByIds', function (list, sortOrder, callback) {
      //      if (list === ['GroupA']) {
      console.log(list);
      return callback(null, [{id: 'GroupA', longName: 'Gruppe A', description: 'Dies ist Gruppe A.', type: 'Themengruppe'}]);
      //      }
      //      Callback(null, []);
    });
    done();
  });

  after(function (done) {
    sympa.getAllAvailableLists.restore();
    groupsPersistence.listByIds.restore();
    done();
  });

  it('shows all available lists', function (done) {
    request(app)
    .get('/')
    .expect(200)
    .expect('Content-Type', /text\/html/)
    .expect(/Gruppen/)
    .expect(/Gruppe A/, done);
  });

  it('does not allow to create a new group for normal visitors', function (done) {

    request(app)
    .get('/new')
    .expect(302, done);
  });

  it('does not allow to edit an existing group for normal visitors', function (done) {
    request(app)
    .get('/edit/GroupA')
    .expect(302, done);
  });

  it('displays an existing group and membercount', function (done) {

    sinon.stub(sympa, 'getUsersOfList', function (groupname, callback) {
      if (groupname === 'GroupA') {
        return callback(['peter@google.de', 'hans@aol.com']);
      }
    });
    sinon.stub(groupsPersistence, 'getById', function (listname, callback) {
      // if (listname === '/^GroupA$/i') {
      console.log(listname);
      return callback(null, {id: 'GroupA', longName: 'Gruppe A', description: 'Dies ist Gruppe A.', type: 'Themengruppe'});
      // }
    });
    sinon.stub(membersPersistence, 'listByEMails', function (emails, sortOrder, callback) {
      console.log(emails);
      return callback(null, [
        { firstname: 'Hans', lastname: 'Dampf' },
        { firstname: 'Peter', lastname: 'Meyer' }
      ]);
    });

    request(app)
    .get('/GroupA')
    .expect(200)
    .expect('Content-Type', /text\/html/)
    .expect(/Gruppe A<\/title>/)
    .expect(/Dies ist Gruppe A./)
    .expect(/Themengruppe/)
    .expect(/Mitglieder der Gruppe:/)
    .expect(/Diese Gruppe hat 2 Mitglieder/, function (err) {
      sympa.getUsersOfList.restore();
      groupsPersistence.getById.restore();
      membersPersistence.listByEMails.restore();
      done(err);
    });
  });

  it('does not allow save for an existing or a newly created Group for normal visitors', function (done) {
    request(app)
    .post('/submit')
    .expect(302, done);
  });

});
