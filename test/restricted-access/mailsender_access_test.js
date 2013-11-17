"use strict";

var request = require('supertest');
require('../configureForTest');

var app = require('../../app').create();

describe('Mailsender application security for normal visitors does not allow to access for', function () {

  it('any URI', function (done) {
    request(app).get('/mailsender/something').expect(302).expect('location', /login/, done);
  });

  it('/invitation', function (done) {
    request(app).get('/invitation').expect(302).expect('location', /login/, done);
  });

});
