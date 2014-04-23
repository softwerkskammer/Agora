"use strict";

var moment = require('moment-timezone');
var sinon = require('sinon').sandbox.create();
var expect = require('must');
var beans = require('../../testutil/configureForTest').get('beans');
var Git = beans.get('gitmech');
var gitExec = beans.get('gitExec');

describe('the gitmech module', function () {

  afterEach(function () {
    sinon.restore();
  });

  it('return file contents as string', function (done) {
    sinon.stub(gitExec, 'command', function (args, callback) {
      if (args[0] === 'show' && args[1] === '1:path') { callback(null, new Buffer('string')); }
    });
    Git.readFile('path', 1, function (err, string) {
      expect(string).to.equal('string');
      done();
    });
  });

  it('produces sensible metadata via "git log" for editing', function (done) {
    sinon.stub(gitExec, 'command', function (args, callback) {
      if (args[0] === 'log') {
        callback(null, new Buffer('7f91fc6\n' +
          '7f91fc607da7947e62b2d8a52088ee0ce29a88c8\n' +
          'leider\n' +
          '2014-03-01 18:36:29 +0100\n' +
          'no comment\n'));
      }
    });
    Git.log('path', 'HEAD', 1, function (err, metadatas) {
      var metadata = metadatas[0];
      expect(metadatas).to.have.length(1);
      expect(metadata.name).to.equal('path');
      expect(metadata.hashRef).to.equal('HEAD');
      expect(metadata.fullhash).to.equal('7f91fc607da7947e62b2d8a52088ee0ce29a88c8');
      expect(metadata.author).to.equal('leider');
      expect(metadata.date).to.equal('2014-03-01 18:36:29 +0100');
      expect(metadata.comment).to.equal('no comment');
      done();
    });
  });

  it('produces sensible metadata via "git log" for viewing the history', function (done) {
    sinon.stub(gitExec, 'command', function (args, callback) {
      if (args[0] === 'log') {
        callback(null, new Buffer('7f91fc6\n' +
          '7f91fc607da7947e62b2d8a52088ee0ce29a88c8\n' +
          'leider\n' +
          '2014-03-01 18:36:29 +0100\n' +
          'no comment\n' +
          '7f91fc6\n' +
          '7f91fc607da7947e62b2d8a52088ee0ce29a88c8\n' +
          'leider\n' +
          '2014-03-01 18:36:29 +0100\n' +
          'no comment\n' +
          '16e441b\n' +
          '16e441b7db64acf4980a067047b0d9fb5cf9bb3e\n' +
          'trauerleider\n' +
          '2014-02-15 16:18:44 +0100\n' +
          'no comment\n' +
          'a5967c3\n' +
          'a5967c3594f637618798b6687e0a36ae2873b60d\n' +
          'trauerleider\n' +
          '2014-02-06 21:10:33 +0100\n' +
          'no comment\n' +
          '3d38d9d\n' +
          '3d38d9dad4d205ceedb4861bc0cfe292e245c307\n' +
          'trauerleider\n' +
          '2013-12-08 12:53:42 +0100\n' +
          'no comment\n'));
      }
    });
    Git.log('path', 'HEAD', 1, function (err, metadatas) {
      var metadata = metadatas[0];
      expect(metadatas).to.have.length(5);

      expect(metadata.name).to.equal('path');
      expect(metadata.hashRef).to.equal('HEAD');
      expect(metadata.fullhash).to.equal('7f91fc607da7947e62b2d8a52088ee0ce29a88c8');
      expect(metadata.author).to.equal('leider');
      expect(metadata.date).to.equal('2014-03-01 18:36:29 +0100');
      expect(metadata.comment).to.equal('no comment');

      expect(metadatas[1].hashRef).to.equal('7f91fc6');
      expect(metadatas[2].hashRef).to.equal('16e441b');
      expect(metadatas[3].hashRef).to.equal('a5967c3');
      expect(metadatas[4].hashRef).to.equal('3d38d9d');
      done();
    });
  });

  it('calls the callback with an error when failing at "log"', function (done) {
    sinon.stub(gitExec, 'command', function (args, callback) { callback(new Error()); });
    Git.log('path', 'HEAD', 1, function (err) {
      expect(err).to.exist();
      done();
    });
  });

  it('produces sensible metadata via "latestChanges" for sening change emails', function (done) {
    sinon.stub(gitExec, 'command', function (args, callback) {
      if (args[0] === 'log') {
        callback(null, new Buffer('60ca4ed\n' +
          '60ca4eda5b79fd55461a78725ff0815cfd3f8550\n' +
          'leider\n' +
          '2014-03-13 20:06:51 +0100\n' +
          'no comment\n' +
          '19c89ae\n' +
          '19c89ae3e7601b002133df569a1a4d57aaaa3271\n' +
          'leider\n' +
          '2014-03-13 20:06:19 +0100\n' +
          'rename: "blog_2014-02-12neuereintrag" -> "blog_2014-02-12---fdadfadfjj-neuereintrag"\n' +
          'f327d71\n' +
          'f327d711e3e8f0104cde2902198512444af46df3\n' +
          'leider\n' +
          '2014-03-09 14:37:59 +0100\n' +
          'no comment\n'));
      }
    });
    Git.latestChanges('path', moment(), function (err, metadatas) {
      expect(metadatas).to.have.length(3);
      expect(metadatas[0].hashRef).to.equal('f327d71');
      expect(metadatas[1].hashRef).to.equal('19c89ae');
      expect(metadatas[2].hashRef).to.equal('60ca4ed');
      done();
    });
  });

  it('calls the callback with an error when failing at "latestChanges"', function (done) {
    sinon.stub(gitExec, 'command', function (args, callback) { callback(new Error()); });
    Git.latestChanges('path', moment(), function (err) {
      expect(err).to.exist();
      done();
    });
  });

});
