'use strict';

const request = require('supertest');
require('../../testutil/configureForTest');

const app = require('../../app').create();

describe('Some pages security for normal visitors does not allow to access', () => {

  it('/dashboard', done => {
    request(app).get('/dashboard/').expect(302).expect('location', /login/, done);
  });

});
