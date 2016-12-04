'use strict';

const request = require('supertest');
require('../../testutil/configureForTest');

const app = require('../../app').create();

describe('Activity results application security for normal visitors does not allow to access for', () => {

  it('/{name}', done => {
    request(app).get('/activityresults/socrates').expect(302).expect('location', /login/, done);
  });

});
