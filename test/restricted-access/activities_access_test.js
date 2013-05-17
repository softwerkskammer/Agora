"use strict";

var request = require('supertest');
require('../configureForTest');

var app = require('../../app').create();

describe('Activities application security for normal visitors does not allow to access for', function () {

  it('/new', function (done) {
    request(app).get('/activities/new').expect(302).expect('location', /mustBeAdmin/, done);
  });

  it('/edit', function (done) {
    request(app).get('/activities/edit/EventA').expect(302).expect('location', /mustBeAdmin/, done);
  });

  it('/submit', function (done) {
    request(app).post('/activities/submit').expect(302).expect('location', /mustBeAdmin/, done);
  });

  it('/subscribe', function (done) {
    request(app).get('/activities/subscribe/eventid').expect(302).expect('location', /login/, done);
  });

});
