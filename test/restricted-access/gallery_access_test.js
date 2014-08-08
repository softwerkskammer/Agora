'use strict';

var request = require('supertest');
require('../../testutil/configureForTest');

var app = require('../../app').create();

describe('Gallery application security for normal visitors does not allow to access for', function () {

  it('/{name}', function (done) {
    request(app).get('/gallery/some-image').expect(302).expect('location', /login/, done);
  });

  it('/', function (done) {
    request(app).post('/gallery/').expect(302).expect('location', /login/, done);
  });

});
