'use strict';

require('../../testutil/configureForTest');

const app = require('../../app').create();
const request = require('supertest');
const theApp = request(app);

function checkGetUrlForRedirection(url, done) {
  theApp.get(url).expect(302).expect('location', /login/, done);
}

function checkPostUrlForRedirection(url, done) {
  theApp.post(url).expect(302).expect('location', /login/, done);
}

describe('Activities application security for normal visitors does not allow to access for', () => {

  it('/new', done => checkGetUrlForRedirection('/activities/new', done));

  it('/newLike', done => checkGetUrlForRedirection('/activities/newLike/other', done));

  it('/edit', done => checkGetUrlForRedirection('/activities/edit/EventA', done));

  it('/submit', done => checkPostUrlForRedirection('/activities/submit', done));

  it('/addon', done => checkGetUrlForRedirection('/activities/addon/someActivity', done));

  it('/addons', done => checkGetUrlForRedirection('/activities/addons/someActivity', done));

  it('/payment', done => checkGetUrlForRedirection('/activities/payment/someActivity', done));

  it('/paymentReceived', done => checkGetUrlForRedirection('/activities/paymentReceived/someActivity', done));

  it('/subscribe', done => checkPostUrlForRedirection('/activities/subscribe', done));

  it('/addToWaitinglist', done => checkPostUrlForRedirection('/activities/addToWaitinglist', done));

});

describe('Activity results application security for normal visitors does not allow to access for', () => {

  it('/{name}', done => checkGetUrlForRedirection('/activityresults/socrates', done));

});

describe('Gallery application security for normal visitors does not allow to access for', () => {

  it('/{name}', done => checkGetUrlForRedirection('/gallery/some-image', done));

  it('/', done => checkPostUrlForRedirection('/gallery/', done));

});

describe('Groups application security for normal visitors does not allow to access for', () => {

  it('/new', done => checkGetUrlForRedirection('/groups/new', done));

  it('/edit', done => checkGetUrlForRedirection('/groups/edit/GroupA', done));

  it('/submit', done => checkPostUrlForRedirection('/groups/submit', done));

  it('/subscribe', done => checkPostUrlForRedirection('/groups/subscribe/GroupA', done));

});

describe('Mailarchive application security for normal visitors does not allow to access for', () => {

  it('any URI', done => checkGetUrlForRedirection('/mailarchive/list/group', done));

});

describe('Mailsender application security for normal visitors does not allow to access for', () => {

  it('any URI', done => checkGetUrlForRedirection('/mailsender/something', done));

  it('/invitation', done => checkGetUrlForRedirection('/invitation', done));

});

describe('Members application security for normal visitors does not allow to access for', () => {

  it('/members', done => checkGetUrlForRedirection('/members/', done));

  it('/new', done => checkGetUrlForRedirection('/members/new', done));

  it('/edit', done => checkGetUrlForRedirection('/members/edit/nick', done));

  it('/nickname', done => checkGetUrlForRedirection('/members/nick', done));

  it('/submit', done => checkPostUrlForRedirection('/members/submit', done));

});

describe('Some pages security for normal visitors does not allow to access', () => {

  it('/dashboard', done => checkGetUrlForRedirection('/dashboard/', done));

});
