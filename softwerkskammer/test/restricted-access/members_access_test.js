'use strict';

const request = require('supertest');
require('../../testutil/configureForTest');

const app = require('../../app').create();

describe('Members application security for normal visitors does not allow to access for', () =>{

  it('/members', done =>{
    request(app).get('/members/').expect(302).expect('location', /login/, done);
  });

  it('/new', done =>{
    request(app).get('/members/new').expect(302).expect('location', /login/, done);
  });

  it('/edit', done =>{
    request(app).get('/members/edit/nick').expect(302).expect('location', /login/, done);
  });

  it('/nickname', done =>{
    request(app).get('/members/nick').expect(302).expect('location', /login/, done);
  });

  it('/submit', done =>{
    request(app).post('/members/submit').expect(302).expect('location', /login/, done);
  });

});
