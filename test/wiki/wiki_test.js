"use strict";

var request = require('supertest');
var express = require('express');
var sinon = require('sinon').sandbox.create();
var expect = require('chai').expect;
var userMock = require('../userMock');

var beans = require('../configureForTest').get('beans');
var wikiAPI = beans.get('wikiAPI');

var app = express();
app.use(express.urlencoded());
app.use(beans.get('accessrights'));
var wikiApp = beans.get('wikiApp')(express());
app.use('/', wikiApp);

describe('Wiki application', function () {

  var pageShow;
  var content = "Hallo, ich bin der Dateiinhalt";
  var nonExistingPage = 'global/nonExisting';
  beforeEach(function (done) {
    pageShow = sinon.stub(wikiAPI, 'showPage',
      function (completePageName, pageVersion, callback) {
        if (completePageName === nonExistingPage) {
          return callback(new Error());
        }
        callback(null, content);
      });
    done();
  });

  afterEach(function (done) {
    sinon.restore();
    done();
  });

  it('shows the index page of a group when requested', function (done) {
    request(app)
      .get('/global/')
      .expect(200)
      .expect(new RegExp(content))
      .expect(/global/)
      .end(function (err) {
        expect(pageShow.calledWith('global/index', 'HEAD')).to.be.ok;
        done(err);
      });
  });

  it('redirects to the index page of group "alle" when requested root', function (done) {
    request(app)
      .get('/')
      .expect(302)
      .expect('Location', '/wiki/alle/')
      .end(function (err) {
        done(err);
      });
  });

  it('redirects to the edit page of a page when the page does not exist yet and a user is logged in', function (done) {
    var root = express();
    root.use(userMock());
    root.use('/', app);
    request(root)
      .get('/' + nonExistingPage)
      .expect(302)
      .expect('Location', '/wiki/edit/' + nonExistingPage)
      .end(function (err) {
        done(err);
      });
  });

  it('redirects to 404 page when the page does not exist yet and a user is not logged in', function (done) {
    request(app)
      .get('/' + nonExistingPage)
      .expect(404)
      .end(function (err) {
        done(err);
      });
  });
});

