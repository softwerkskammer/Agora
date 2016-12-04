'use strict';

const request = require('supertest');
require('../../testutil/configureForTest');

const app = require('../../app').create();

describe('Activities application security for normal visitors does not allow to access for', () => {

  it('/new', done => {
    request(app).get('/activities/new').expect(302).expect('location', /login/, done);
  });

  it('/newLike', done => {
    request(app).get('/activities/newLike/other').expect(302).expect('location', /login/, done);
  });

  it('/edit', done => {
    request(app).get('/activities/edit/EventA').expect(302).expect('location', /login/, done);
  });

  it('/submit', done => {
    request(app).post('/activities/submit').expect(302).expect('location', /login/, done);
  });

  it('/addon', done => {
    request(app).get('/activities/addon/someActivity').expect(302).expect('location', /login/, done);
  });

  it('/addons', done => {
    request(app).get('/activities/addons/someActivity').expect(302).expect('location', /login/, done);
  });

  it('/payment', done => {
    request(app).get('/activities/payment/someActivity').expect(302).expect('location', /login/, done);
  });

  it('/paymentReceived', done => {
    request(app).get('/activities/paymentReceived/someActivity').expect(302).expect('location', /login/, done);
  });

  it('/subscribe', done => {
    request(app).post('/activities/subscribe').expect(302).expect('location', /login/, done);
  });

  it('/addToWaitinglist', done => {
    request(app).post('/activities/addToWaitinglist').expect(302).expect('location', /login/, done);
  });

});
