'use strict';

var request = require('supertest');
require('../../testutil/configureForTest');

var app = require('../../app').create();

describe('Some pages security for normal visitors does not allow to access', function () {

  it('/dashboard', function (done) {
    request(app).get('/dashboard/').expect(302).expect('location', /login/, done);
  });

});
