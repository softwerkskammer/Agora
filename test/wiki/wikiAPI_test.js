"use strict";

var sinon = require('sinon').sandbox.create();
var expect = require('must');
var _ = require('lodash');
var beans = require('../../testutil/configureForTest').get('beans');
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
        expect(err).to.exist();
        expect(cont).to.not.exist();
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
        expect(metadata).to.be.empty();
        done(err);
      });
    });
  });

});

//This is an extra group because the Git.readFile mock has a different objective
describe('WikiAPI (getBlogPosts)', function () {

  beforeEach(function () {
    sinon.stub(Git, 'lsblogposts', function (groupname, pattern, callback) {
      if (groupname === 'internet') {
        callback(null, ['internet/blog_2013-10-01AgoraCodeKata.md', 'internet/blog_2013-11-01LeanCoffeeTest.md']);
      } else if (groupname === 'alle') {
        callback(null, []);
      } else if (groupname === 'error') {
        callback(null, ['error/blog_2013-10-01.md', 'error/blog_notadate.md', 'error/blog_2013-05-01.md', 'error/blog_2013-05-1.md', 'error/blog_2013-5-01.md', 'error/blog_.md']);
      }
    });
    sinon.stub(Git, 'readFile', function (path, version, callback) {
      if (path === "internet/blog_2013-11-01LeanCoffeeTest.md") {
        callback(null, "####   Lean Coffee November 2013\n" +
          "\n" +
          "Und beim nächsten Mal haben wir dann.\n" +
          "\n" +
          "Diesen Blog gemacht.");
      } else if (path === "internet/blog_2013-10-01AgoraCodeKata.md") {
        callback(null, "Agora Code-Kata Oktober 2013\n" +
          "\n" +
          "Weil viele uns weder JavaScript noch populäre JavaScript...\n" +
          "\n" +
          "Leider hatten wir vorher keine Anweisungen herumgeschickt, ...");
      } else if (path === "error/blog_2013-10-01.md") {
        callback(null, "#1");
      } else if (path === "error/blog_notadate.md") {
        callback(null, "#2");
      } else if (path === "error/blog_2013-05-01.md") {
        callback(null, "#3");
      } else if (path === "error/blog_2013-05-1.md") {
        callback(null, "#4");
      } else if (path === "error/blog_2013-5-01.md") {
        callback(null, "#5");
      } else if (path === "error/blog_.md") {
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
      expect(result.length === 2).to.be(true);

      var post1 = result[0];
      expect(post1.title).to.equal("Lean Coffee November 2013");
      expect(post1.teaser).to.equal("Und beim nächsten Mal haben wir dann.");
      expect(post1.path).to.equal("internet/blog_2013-11-01LeanCoffeeTest");
      expect(post1.date.isSame(moment("2013-11-01"))).to.be(true);

      var post2 = result[1];
      expect(post2.title).to.equal("Agora Code-Kata Oktober 2013");
      expect(post2.teaser).to.equal("Weil viele uns weder JavaScript noch populäre JavaScript...");
      expect(post2.path).to.equal("internet/blog_2013-10-01AgoraCodeKata");
      expect(post2.date.isSame(moment("2013-10-01"))).to.be(true);

      done(err);
    });
  });

  it('returns no blog posts if there are none', function (done) {
    wikiAPI.getBlogpostsForGroup("alle", function (err, result) {
      expect(result.length === 0).to.be(true);
      done(err);
    });
  });

  it('skips empty posts and posts without proper date', function (done) {
    wikiAPI.getBlogpostsForGroup("error", function (err, result) {
      expect(result.length).to.equal(4);
      var titles = _.pluck(result, 'title');
      expect(titles).to.contain('1');
      expect(titles).to.contain('3');
      expect(titles).to.contain('4');
      expect(titles).to.contain('5');
      done(err);
    });
  });
});

describe('Wiki API (daily digest)', function () {

  var subdirs = ['dirA', 'dirB'];
  var filesForDirA = ['dirA/fileA1', 'dirA/fileA2'];
  var filesForDirB = ['dirB/fileB1', 'dirB/fileB2'];
  var metadataA1 = {author: 'authorA1', fullhash: 'hashA1', date: '2014-01-11 18:45:29 +0100'};
  var metadataA2 = {author: 'authorA2', fullhash: 'hashA2', date: '2014-01-10 18:45:29 +0100'};
  var metadataB1 = {author: 'authorB1', fullhash: 'hashB1', date: '2014-01-11 18:45:29 +0100'};

  beforeEach(function () {
    sinon.stub(Git, 'ls', function (dirname, callback) {
      if (dirname === 'dirA') { return callback(null, filesForDirA); }
      if (dirname === 'dirB') { return callback(null, filesForDirB); }
    });

    sinon.stub(Git, 'latestChanges', function (filename, moment, callback) {
      if (filename.indexOf('A1') > -1) { return callback(null, [metadataA1]); }
      if (filename.indexOf('A2') > -1) { return callback(null, [metadataA2]); }
      if (filename.indexOf('B1') > -1) { return callback(null, [metadataB1]); }
      callback(null, []);
    });

    sinon.stub(Git, 'readFile', function (filename, tag, callback) {
      callback(null);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('Digest', function () {
    it('finds all changed pages', function (done) {
      sinon.stub(Git, 'lsdirs', function (callback) {
        callback(null, subdirs);
      });

      wikiAPI.findPagesForDigestSince(moment(), function (err, pages) {
        expect(pages.length).to.equal(2);
        pages.forEach(function (page) {
          if (page.dir === 'dirA') {
            expect(page.files.length).to.equal(2);
          } else {
            expect(page.files.length).to.equal(1);
          }
        });
        done(err);
      });
    });

    it('handles an error correctly', function (done) {
      sinon.stub(Git, 'lsdirs', function (callback) {
        callback(new Error());
      });

      wikiAPI.findPagesForDigestSince(moment(), function (err) {
        expect(err).to.exist();
        done();
      });
    });
  });
});
