"use strict";

var request = require('supertest');
require('../../testutil/configureForTest');

var app = require('../../app').create();

describe('Groups application security for normal visitors does not allow to access for', function () {

  it('/new', function (done) {
    request(app).get('/groups/new').expect(302).expect('location', /mustBeSuperuser/, done);
  });

  it('/edit', function (done) {
    request(app).get('/groups/edit/GroupA').expect(302).expect('location', /mustBeSuperuser/, done);
  });

  it('/submit', function (done) {
    request(app).post('/groups/submit').expect(302).expect('location', /mustBeSuperuser/, done);
  });

  it('/subscribe', function (done) {
    request(app).post('/groups/subscribe/GroupA').expect(302).expect('location', /login/, done);
  });

  it('/unsubscribe', function (done) {
    request(app).post('/groups/unsubscribe/GroupA').expect(302).expect('location', /login/, done);
  });

});
