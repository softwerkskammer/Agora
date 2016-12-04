'use strict';

const request = require('supertest');
require('../../testutil/configureForTest');

const app = require('../../app').create();

describe('Groups application security for normal visitors does not allow to access for', () =>{

  it('/new', done =>{
    request(app).get('/groups/new').expect(302).expect('location', /login/, done);
  });

  it('/edit', done =>{
    request(app).get('/groups/edit/GroupA').expect(302).expect('location', /login/, done);
  });

  it('/submit', done =>{
    request(app).post('/groups/submit').expect(302).expect('location', /login/, done);
  });

  it('/subscribe', done =>{
    request(app).post('/groups/subscribe/GroupA').expect(302).expect('location', /login/, done);
  });

});
