"use strict";

var request = require('supertest');
require('../configureForTest');

var app = require('../../app').create();

describe('Mailarchive application security for normal visitors does not allow to access for', function () {

  it('any URI', function (done) {
    request(app).get('/mailarchive/list/group').expect(302).expect('location', /login/, done);
  });

});
