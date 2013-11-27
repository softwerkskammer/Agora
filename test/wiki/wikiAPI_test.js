"use strict";

var sinon = require('sinon').sandbox.create();
var expect = require('chai').expect;

var beans = require('../configureForTest').get('beans');
var wikiAPI = beans.get('wikiAPI');
var Git = beans.get('gitmech');

describe('Wiki API', function () {

  var content = "Hallo, ich bin der Dateiinhalt";
  var nonExistingPage = 'global/nonExisting';

  beforeEach(function (done) {
    sinon.stub(Git, 'readFile', function (completePageName, pageVersion, callback) {
      if (completePageName === nonExistingPage + '.md') {
        return callback(new Error());
      }
      callback(null, content);
    });
    sinon.stub(Git, 'log', function (path, version, howMany, callback) {
      callback(null, []);
    });
    sinon.stub(Git, 'absPath', function (path) {
      return path;
    });
    done();
  });

  afterEach(function (done) {
    sinon.restore();
    done();
  });

  describe('(showPage)', function () {
    it('returns content for a requested existing page', function (done) {
      wikiAPI.showPage('pageName', '11', function (err, cont) {
        expect(content).to.equal(cont);
        done();
      });
    });

    it('returns an error if the requested page is not found', function (done) {
      wikiAPI.showPage(nonExistingPage, '11', function (err, cont) {
        expect(err).to.exist;
        expect(cont).to.not.exist;
        done();
      });
    });
  });

  describe('(editPage)', function () {
    it('indicates that the file is none existent', function (done) {
      wikiAPI.pageEdit('pageName', function (err, cont, metadata) {
        expect('').to.equal(cont);
        expect(metadata).to.contain('NEW');
        done();
      });
    });

    it('returns the content of the file to edit if it exists', function (done) {
      wikiAPI.pageEdit('README', function (err, cont, metadata) {
        expect(content).to.equal(cont);
        expect(metadata).to.be.empty;
        done();
      });
    });
  });

});

