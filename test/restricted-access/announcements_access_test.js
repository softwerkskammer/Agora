"use strict";

var request = require('supertest');
require('../configureForTest');

var app = require('../../app').create();

describe('Announcements application security for normal visitors does not allow to access for', function () {

  it('/new', function (done) {
    request(app).get('/announcements/new').expect(302).expect('location', /mustBeAdmin/, done);
  });

  it('/edit', function (done) {
    request(app).get('/announcements/edit/AnnA').expect(302).expect('location', /mustBeAdmin/, done);
  });

  it('/submit', function (done) {
    request(app).post('/announcements/submit').expect(302).expect('location', /mustBeAdmin/, done);
  });

});
