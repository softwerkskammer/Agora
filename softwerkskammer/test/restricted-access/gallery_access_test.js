'use strict';

const request = require('supertest');
require('../../testutil/configureForTest');

const app = require('../../app').create();

describe('Gallery application security for normal visitors does not allow to access for', () => {

  it('/{name}', done => {
    request(app).get('/gallery/some-image').expect(302).expect('location', /login/, done);
  });

  it('/', done => {
    request(app).post('/gallery/').expect(302).expect('location', /login/, done);
  });

});
