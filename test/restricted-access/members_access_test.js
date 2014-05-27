'use strict';

var request = require('supertest');
require('../../testutil/configureForTest');

var app = require('../../app').create();

describe('Members application security for normal visitors does not allow to access for', function () {

  it('/members', function (done) {
    request(app).get('/members/').expect(302).expect('location', /login/, done);
  });

  it('/new', function (done) {
    request(app).get('/members/new').expect(302).expect('location', /login/, done);
  });

  it('/edit', function (done) {
    request(app).get('/members/edit/nick').expect(302).expect('location', /login/, done);
  });

  it('/nickname', function (done) {
    request(app).get('/members/nick').expect(302).expect('location', /login/, done);
  });

  it('/submit', function (done) {
    request(app).post('/members/submit').expect(302).expect('location', /login/, done);
  });

});
