'use strict';

require('../../testutil/configureForTest');

const app = require('../../app').create();
const request = require('supertest');
const theApp = request(app);

describe('Activities application security for normal visitors does not allow to access for', () => {

  it('/new', done => {
    theApp.get('/activities/new').expect(302).expect('location', /login/, done);
  });

  it('/newLike', done => {
    theApp.get('/activities/newLike/other').expect(302).expect('location', /login/, done);
  });

  it('/edit', done => {
    theApp.get('/activities/edit/EventA').expect(302).expect('location', /login/, done);
  });

  it('/submit', done => {
    theApp.post('/activities/submit').expect(302).expect('location', /login/, done);
  });

  it('/addon', done => {
    theApp.get('/activities/addon/someActivity').expect(302).expect('location', /login/, done);
  });

  it('/addons', done => {
    theApp.get('/activities/addons/someActivity').expect(302).expect('location', /login/, done);
  });

  it('/payment', done => {
    theApp.get('/activities/payment/someActivity').expect(302).expect('location', /login/, done);
  });

  it('/paymentReceived', done => {
    theApp.get('/activities/paymentReceived/someActivity').expect(302).expect('location', /login/, done);
  });

  it('/subscribe', done => {
    theApp.post('/activities/subscribe').expect(302).expect('location', /login/, done);
  });

  it('/addToWaitinglist', done => {
    theApp.post('/activities/addToWaitinglist').expect(302).expect('location', /login/, done);
  });

});

describe('Activity results application security for normal visitors does not allow to access for', () => {

  it('/{name}', done => {
    theApp.get('/activityresults/socrates').expect(302).expect('location', /login/, done);
  });

});

describe('Gallery application security for normal visitors does not allow to access for', () => {

  it('/{name}', done => {
    theApp.get('/gallery/some-image').expect(302).expect('location', /login/, done);
  });

  it('/', done => {
    theApp.post('/gallery/').expect(302).expect('location', /login/, done);
  });

});

describe('Groups application security for normal visitors does not allow to access for', () =>{

  it('/new', done =>{
    theApp.get('/groups/new').expect(302).expect('location', /login/, done);
  });

  it('/edit', done =>{
    theApp.get('/groups/edit/GroupA').expect(302).expect('location', /login/, done);
  });

  it('/submit', done =>{
    theApp.post('/groups/submit').expect(302).expect('location', /login/, done);
  });

  it('/subscribe', done =>{
    theApp.post('/groups/subscribe/GroupA').expect(302).expect('location', /login/, done);
  });

});

describe('Mailarchive application security for normal visitors does not allow to access for', () => {

  it('any URI', done => {
    theApp.get('/mailarchive/list/group').expect(302).expect('location', /login/, done);
  });

});

describe('Mailsender application security for normal visitors does not allow to access for', () => {

  it('any URI', done => {
    theApp.get('/mailsender/something').expect(302).expect('location', /login/, done);
  });

  it('/invitation', done => {
    theApp.get('/invitation').expect(302).expect('location', /login/, done);
  });

});

describe('Members application security for normal visitors does not allow to access for', () =>{

  it('/members', done =>{
    theApp.get('/members/').expect(302).expect('location', /login/, done);
  });

  it('/new', done =>{
    theApp.get('/members/new').expect(302).expect('location', /login/, done);
  });

  it('/edit', done =>{
    theApp.get('/members/edit/nick').expect(302).expect('location', /login/, done);
  });

  it('/nickname', done =>{
    theApp.get('/members/nick').expect(302).expect('location', /login/, done);
  });

  it('/submit', done =>{
    theApp.post('/members/submit').expect(302).expect('location', /login/, done);
  });

});

describe('Some pages security for normal visitors does not allow to access', () => {

  it('/dashboard', done => {
    theApp.get('/dashboard/').expect(302).expect('location', /login/, done);
  });

});
