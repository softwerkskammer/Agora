'use strict';

const request = require('supertest');
require('../../testutil/configureForTest');

const app = require('../../app').create();

describe('Mailsender application security for normal visitors does not allow to access for', () => {

  it('any URI', done => {
    request(app).get('/mailsender/something').expect(302).expect('location', /login/, done);
  });

  it('/invitation', done => {
    request(app).get('/invitation').expect(302).expect('location', /login/, done);
  });

});
