'use strict';

require('../../testutil/configureForTest');
const async = require('async');

const app = require('../../app').create();
const request = require('supertest');
const theApp = request(app);

describe('Security for normal visitors does not allow to access ', () => {
  function checkGetUrlForRedirection(url, cb) {
    theApp.get(url).expect(302).expect('location', /login/, cb);
  }

  function checkPostUrlForRedirection(url, cb) {
    theApp.post(url).expect(302).expect('location', /login/, cb);
  }

  it('GET URLs', done => {
    async.each([
      '/activities/new',
      '/activities/newLike/other',
      '/activities/edit/EventA',
      '/activities/addon/someActivity',
      '/activities/addons/someActivity',
      '/activities/payment/someActivity',
      '/activities/paymentReceived/someActivity',
      '/gallery/some-image',
      '/groups/new',
      '/groups/edit/GroupA',
      '/mailsender/something',
      '/invitation',
      '/members/',
      '/members/new',
      '/members/edit/nick',
      '/members/nick',
      '/dashboard/'
    ], checkGetUrlForRedirection, done);
  });

  it('POST URLs', done => {
    async.each([
      '/activities/submit',
      '/activities/subscribe',
      '/activities/addToWaitinglist',
      '/gallery/',
      '/groups/submit',
      '/groups/subscribe/GroupA',
      '/members/submit'
    ], checkPostUrlForRedirection, done);
  });
});
