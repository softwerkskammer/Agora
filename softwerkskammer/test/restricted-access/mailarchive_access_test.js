'use strict';

const request = require('supertest');
require('../../testutil/configureForTest');

const app = require('../../app').create();

describe('Mailarchive application security for normal visitors does not allow to access for', () => {

  it('any URI', done => {
    request(app).get('/mailarchive/list/group').expect(302).expect('location', /login/, done);
  });

});
