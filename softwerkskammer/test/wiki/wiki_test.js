'use strict';

var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');
var wikiService = beans.get('wikiService');

var createApp = require('../../testutil/testHelper')('wikiApp').createApp;

describe('Wiki application', function () {

  var pageShow;
  var content = 'Hallo, ich bin der Dateiinhalt';
  var nonExistingPage = 'global/nonexisting';
  beforeEach(function () {
    pageShow = sinon.stub(wikiService, 'showPage',
      function (completePageName, pageVersion, callback) {
        if (completePageName === nonExistingPage) {
          return callback(new Error());
        }
        callback(null, content);
      });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('shows an existing page in wiki "global" when requested', function (done) {
    request(createApp())
      .get('/global/somepage')
      .expect(200)
      .expect(new RegExp(content))
      .end(function (err) {
        expect(pageShow.calledWith('global/somepage', 'HEAD')).to.be(true);
        done(err);
      });
  });

  it('normalizes page names', function (done) {
    request(createApp())
      .get('/global/Söme%20Päg\'é')
      .expect(200)
      .end(function (err) {
        expect(pageShow.calledWith('global/some-page', 'HEAD')).to.be(true);
        done(err);
      });
  });

  it('redirects to the group\'s index page when group directory is requested', function (done) {
    request(createApp())
      .get('/global/')
      .expect(302)
      .expect('Location', '/wiki/global/index')
      .end(function (err) {
        done(err);
      });
  });

  it('redirects to the index page of group "alle" when root is requested', function (done) {
    request(createApp())
      .get('/')
      .expect(302)
      .expect('Location', '/wiki/alle/index')
      .end(function (err) {
        done(err);
      });
  });

  it('redirects to the edit page of a page when the page does not exist yet and a user is logged in', function (done) {
    request(createApp({id: 'member'}))
      .get('/' + nonExistingPage)
      .expect(302)
      .expect('Location', '/wiki/edit/' + nonExistingPage)
      .end(function (err) {
        done(err);
      });
  });

  it('redirects to 404 page when the page does not exist yet and a user is not logged in', function (done) {
    request(createApp())
      .get('/' + nonExistingPage)
      .expect(404)
      .end(function (err) {
        done(err);
      });
  });
});

