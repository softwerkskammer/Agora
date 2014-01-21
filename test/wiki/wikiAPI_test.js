"use strict";

var sinon = require('sinon').sandbox.create();
var expect = require('chai').expect;

var beans = require('../configureForTest').get('beans');
var wikiAPI = beans.get('wikiAPI');
var moment = require('moment-timezone');
var Git = beans.get('gitmech');

describe('Wiki API', function () {

  var content = "Hallo, ich bin der Dateiinhalt";
  var nonExistingPage = 'global/nonExisting';

  beforeEach(function () {
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
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('(showPage)', function () {
    it('returns content for a requested existing page', function (done) {
      wikiAPI.showPage('pageName', '11', function (err, cont) {
        expect(content).to.equal(cont);
        done(err);
      });
    });

    it('returns an error if the requested page is not found', function (done) {
      wikiAPI.showPage(nonExistingPage, '11', function (err, cont) {
        expect(err).to.exist;
        expect(cont).to.not.exist;
        done(); // error condition - do not pass err
      });
    });
  });

  describe('(editPage)', function () {
    it('indicates that the file is none existent', function (done) {
      wikiAPI.pageEdit('pageName', function (err, cont, metadata) {
        expect('').to.equal(cont);
        expect(metadata).to.contain('NEW');
        done(err);
      });
    });

    it('returns the content of the file to edit if it exists', function (done) {
      wikiAPI.pageEdit('README', function (err, cont, metadata) {
        expect(content).to.equal(cont);
        expect(metadata).to.be.empty;
        done(err);
      });
    });
  });



});

//This is an extra group because the Git.readFile mock has a different objective
describe('WikiAPI (getBlogPosts)', function () {

  beforeEach(function () {
    sinon.stub(Git, 'lsblogposts', function (groupname, callback) {
      if (groupname === 'internet') {
        callback(null, ['internet/blog_oktober2013.md', 'internet/blog_november2013.md']);
      } else if (groupname === 'alle') {
        callback(null, []);
      } else if (groupname === 'error') {
        callback(null, ['error/blog_1.md', 'error/blog_2.md', 'error/blog_3.md', 'error/blog_4.md']);
      }
    });
    sinon.stub(Git, 'readFile', function (path, version, callback) {
      if (path === "internet/blog_november2013.md") {
        callback(null, "Lean Coffee November 2013, 2013-11-01\n" +
          "\n" +
          "Und beim nächsten Mal haben wir dann.\n" +
          "\n" +
          "Diesen Blog gemacht.");
      } else if (path === "internet/blog_oktober2013.md") {
        callback(null, "Agora Code-Kata Oktober 2013, 2013-10-01\n" +
          "\n" +
          "Weil viele uns weder JavaScript noch populäre JavaScript...\n" +
          "\n" +
          "Leider hatten wir vorher keine Anweisungen herumgeschickt, ...");
      } else if (path === "error/blog_1.md") {
        callback(null, "1, 2013-10-01");
      } else if (path === "error/blog_2.md") {
        callback(null, "2, not a date");
      } else if (path === "error/blog_3.md") {
        callback(null, "3, 2013-05-01");
      } else if (path === "error/blog_4.md") {
        callback(null, "");
      }

    });
  });

  afterEach(function () {
    Git.readFile.restore();
    Git.lsblogposts.restore();
  });

  it('returns two properly parsed blog posts for the group internet', function (done) {
    wikiAPI.getBlogpostsForGroup("internet", function (err, result) {
      expect(result.length === 2).to.be.true;

      var post1 = result[0];
      expect(post1.title).to.equal("Lean Coffee November 2013");
      expect(post1.teaser).to.equal("Und beim nächsten Mal haben wir dann.");
      expect(post1.path).to.equal("internet/blog_november2013");
      expect(post1.date.isSame(new moment("2013-11-01"))).to.be.true;

      var post2 = result[1];
      expect(post2.title).to.equal("Agora Code-Kata Oktober 2013");
      expect(post2.teaser).to.equal("Weil viele uns weder JavaScript noch populäre JavaScript...");
      expect(post2.path).to.equal("internet/blog_oktober2013");
      expect(post2.date.isSame(new moment("2013-10-01"))).to.be.true;

      done(err);
    });
  });

  it('returns no blog posts for the group alle', function (done) {
    wikiAPI.getBlogpostsForGroup("alle", function (err, result) {
      expect(result.length === 0).to.be.true;
      done(err);
    });
  });

  it('sorts post without a date to the end and skips empty posts', function (done) {
    wikiAPI.getBlogpostsForGroup("error", function (err, result) {
      expect(result.length === 3).to.be.true;

      expect(result[0].title).to.equal('1');
      expect(result[1].title).to.equal('3');
      expect(result[2].title).to.equal('2');
      done(err);
    });
  });
});
