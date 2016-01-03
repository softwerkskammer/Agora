'use strict';
var expect = require('must-dist');
var httpRequest = require('request');
var sinon = require('sinon').sandbox.create();
var conf = require('../testutil/configureForTest');
var beans = conf.get('beans');
var groupsService = beans.get('groupsService');
var groupstore = beans.get('groupstore');
var announcementstore = beans.get('announcementstore');

var baseUri = 'http://localhost:' + parseInt(conf.get('port'), 10);

var app = require('../app.js');

describe('SWK Plattform server', function () {
  beforeEach(function (done) {
    sinon.stub(groupstore, 'allGroups', function (callback) {return callback(null, []); });
    sinon.stub(groupsService, 'getAllAvailableGroups', function (callback) {return callback(null, []); });
    sinon.stub(announcementstore, 'allAnnouncementsUntilToday', function (callback) {return callback(null, []); });
    app.start(done);
  });

  afterEach(function (done) {
    sinon.restore();
    app.stop(done);
  });

  it('responds on a GET for the home page', function (done) {
    httpRequest({uri: baseUri}, function (req, resp) {
      expect(resp).to.exist();
      expect(resp.statusCode).to.equal(200);
      done(); // without error check
    });
  });

  it('responds with HTML on a GET for the home page', function (done) {
    httpRequest({uri: baseUri}, function (req, resp) {
      expect(resp.headers['content-type']).to.contain('text/html');
      done(); // without error check
    });
  });

  it('shows "Softwerkskammer" on the home page', function (done) {
    httpRequest({uri: baseUri}, function (req, resp) {
      expect(resp.body).to.contain('Softwerkskammer');
      done(); // without error check
    });
  });

  it('renders the i18n translated text on the home page correctly', function (done) {
    httpRequest({uri: baseUri}, function (req, resp) {
      expect(resp.body).to.contain('Die Softwerkskammer hat sich 2011 gegründet, um den Austausch Interessierter zum Thema Software Craftsmanship\nzu vereinfachen.');
      done(); // without error check
    });
  });

  it('provides the screen style sheet', function (done) {
    var stylesheetUri = baseUri + '/stylesheets/screen.css';
    httpRequest({uri: stylesheetUri}, function (req, resp) {
      expect(resp.statusCode).to.equal(200);
      expect(resp.headers['content-type']).to.contain('text/css');
      expect(resp.body).to.contain('color:');
      done(); // without error check
    });
  });

  it('provides the clientside membercheck functions', function (done) {
    var stylesheetUri = baseUri + '/clientscripts/check-memberform.js';
    httpRequest({uri: stylesheetUri}, function (req, resp) {
      expect(resp.statusCode).to.equal(200);
      expect(resp.headers['content-type']).to.contain('application/javascript');
      expect(resp.body).to.contain('#memberform');
      done(); // without error check
    });
  });
});

describe('SWK Plattform server with Error', function () {
  beforeEach(function (done) {
    sinon.stub(groupstore, 'allGroups', function (callback) {return callback(new Error(), []); });
    sinon.stub(groupsService, 'getAllAvailableGroups', function (callback) {return callback(null, []); });
    sinon.stub(announcementstore, 'allAnnouncementsUntilToday', function (callback) {return callback(null, []); });
    app.start(done);
  });

  afterEach(function (done) {
    sinon.restore();
    app.stop(done);
  });

  it('renders the i18n translated text on the home page correctly', function (done) {

    httpRequest({uri: baseUri}, function (req, resp) {
      expect(resp.body).to.contain('<li>Was hast Du getan?</li>');
      expect(resp.body).to.contain('<li>Betriebssystem und Browser inkl. Version.</li>');
      expect(resp.body).to.contain('<li>Den Stacktrace</li>');
      expect(resp.body).to.contain('<p>Das Agora-Team bittet um Entschuldigung.</p>');
      done(); // without error check
    });
  });

});
