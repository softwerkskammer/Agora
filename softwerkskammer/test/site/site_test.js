'use strict';

var request = require('supertest');

var app = require('../../testutil/testHelper')('siteApp').createApp();

describe('The router for the site\' pages', function () {
  it('redirects after switching the language', function (done) {
    request(app)
      .get('/language/de?currentUrl=%2Fpeter%2F')
      .expect(302)
      .expect('location', /\/peter\//, done);
  });

  it('calculates a qrcode', function (done) {
    request(app)
      .get('/qrcode?url=%2Fpeter%2F')
      .expect(200)
      .expect('Content-Type', 'image/svg+xml', done);
  });

});
