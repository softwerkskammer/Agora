'use strict';

var request = require('supertest');
require('../../testutil/configureForTest');

var app = require('../../app').create();

describe('Activity results application security for normal visitors does not allow to access for', function () {

  it('/{name}', function (done) {
    request(app).get('/activityresults/socrates').expect(302).expect('location', /login/, done);
  });

});
