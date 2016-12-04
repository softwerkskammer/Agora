'use strict';

const moment = require('moment-timezone');
const R = require('ramda');
const sinon = require('sinon').sandbox.create();
const expect = require('must-dist');
const beans = require('../../testutil/configureForTest').get('beans');
const Git = beans.get('gitmech');
const gitExec = beans.get('gitExec');

describe('the gitmech module', function () {
  afterEach(function () {
    sinon.restore();
  });

  describe('- read operations', function () {
    it('"readFile" returns file contents as string', function (done) {
      sinon.stub(gitExec, 'command', function (args, callback) {
        if (args[0] === 'show' && args[1] === '1:path') { callback(null, 'string'); }
      });
      Git.readFile('path', 1, function (err, string) {
        expect(string).to.equal('string');
        done(err);
      });
    });

    it('"readFile" returns error on error', function (done) {
      sinon.stub(gitExec, 'command', function (args, callback) { callback(new Error()); });
      Git.readFile('path', 1, function (err) {
        expect(err).to.exist();
        done();
      });
    });

    it('produces sensible metadata via "git log" for editing', function (done) {
      sinon.stub(gitExec, 'command', function (args, callback) {
        if (args[0] === 'log') {
          callback(null, '7f91fc6\n' +
            '7f91fc607da7947e62b2d8a52088ee0ce29a88c8\n' +
            'leider\n' +
            '2014-03-01 18:36:29 +0100\n' +
            'no comment\n' +
            'path/file.md\n\n');
        }
      });
      Git.log('path', 'HEAD', 1, function (err, metadatas) {
        const metadata = metadatas[0];
        expect(metadatas).to.have.length(1);
        expect(metadata.name).to.equal('path/file.md');
        expect(metadata.hashRef).to.equal('HEAD');
        expect(metadata.fullhash).to.equal('7f91fc607da7947e62b2d8a52088ee0ce29a88c8');
        expect(metadata.author).to.equal('leider');
        expect(metadata.datestring).to.equal('2014-03-01 18:36:29 +0100');
        expect(metadata.comment).to.equal('no comment');
        done(err);
      });
    });

    it('produces sensible metadata via "git log" for viewing the history', function (done) {
      sinon.stub(gitExec, 'command', function (args, callback) {
        if (args[0] === 'log') {
          callback(null, '7f91fc6\n' +
            '7f91fc607da7947e62b2d8a52088ee0ce29a88c8\n' +
            'leider\n' +
            '2014-03-01 18:36:29 +0100\n' +
            'no comment\n' +
            'path/file.md\n\n' +
            '7f91fc6\n' +
            '7f91fc607da7947e62b2d8a52088ee0ce29a88c8\n' +
            'leider\n' +
            '2014-03-01 18:36:29 +0100\n' +
            'no comment\n' +
            'path/file.md\n\n' +
            '16e441b\n' +
            '16e441b7db64acf4980a067047b0d9fb5cf9bb3e\n' +
            'trauerleider\n' +
            '2014-02-15 16:18:44 +0100\n' +
            'no comment\n' +
            'path/file.md\n\n' +
            'a5967c3\n' +
            'a5967c3594f637618798b6687e0a36ae2873b60d\n' +
            'trauerleider\n' +
            '2014-02-06 21:10:33 +0100\n' +
            'no comment\n' +
            'path/file.md\n\n' +
            '3d38d9d\n' +
            '3d38d9dad4d205ceedb4861bc0cfe292e245c307\n' +
            'trauerleider\n' +
            '2013-12-08 12:53:42 +0100\n' +
            'no comment\n' +
            'path/file.md\n\n');
        }
      });
      Git.log('path', 'HEAD', 1, function (err, metadatas) {
        const metadata = metadatas[0];
        expect(metadatas).to.have.length(5);

        expect(metadata.name).to.equal('path/file.md');
        expect(metadata.hashRef).to.equal('HEAD');
        expect(metadata.fullhash).to.equal('7f91fc607da7947e62b2d8a52088ee0ce29a88c8');
        expect(metadata.author).to.equal('leider');
        expect(metadata.datestring).to.equal('2014-03-01 18:36:29 +0100');
        expect(metadata.comment).to.equal('no comment');

        expect(metadatas[1].hashRef).to.equal('7f91fc6');
        expect(metadatas[2].hashRef).to.equal('16e441b');
        expect(metadatas[3].hashRef).to.equal('a5967c3');
        expect(metadatas[4].hashRef).to.equal('3d38d9d');
        done(err);
      });
    });

    it('can handle renames via "git log" for viewing the history', function (done) {
      sinon.stub(gitExec, 'command', function (args, callback) {
        if (args[0] === 'log') {
          callback(null, '7f91fc6\n' +
            '7f91fc607da7947e62b2d8a52088ee0ce29a88c8\n' +
            'leider\n' +
            '2014-03-01 18:36:29 +0100\n' +
            'rename: "blog_vonheute" -> "blog_2014-03-19_der_blog"\n' +
            'craftsmanswap/blog_2014-03-19_der_blog.md\n' +
            'craftsmanswap/blog_vonheute.md\n\n' +
            '7f91fc6\n' +
            '7f91fc607da7947e62b2d8a52088ee0ce29a88c8\n' +
            'leider\n' +
            '2014-03-01 18:36:29 +0100\n' +
            'no comment\n' +
            'path/file.md\n\n');
        }
      });
      Git.log('path', 'HEAD', 1, function (err, metadatas) {
        var metadata = metadatas[0];
        expect(metadatas).to.have.length(2);

        expect(metadata.name).to.equal('craftsmanswap/blog_2014-03-19_der_blog.md');
        expect(metadata.hashRef).to.equal('HEAD');
        expect(metadata.fullhash).to.equal('7f91fc607da7947e62b2d8a52088ee0ce29a88c8');
        expect(metadata.author).to.equal('leider');
        expect(metadata.datestring).to.equal('2014-03-01 18:36:29 +0100');
        expect(metadata.comment).to.equal('rename: "blog_vonheute" -> "blog_2014-03-19_der_blog"');

        metadata = metadatas[1];
        expect(metadata.name).to.equal('path/file.md');
        expect(metadata.hashRef).to.equal('7f91fc6');
        done(err);
      });
    });

    it('calls the callback with an error when failing at "log"', function (done) {
      sinon.stub(gitExec, 'command', (args, callback) => callback(new Error()));
      Git.log('path', 'HEAD', 1, function (err) {
        expect(err).to.exist();
        done();
      });
    });

    it('produces sensible metadata via "latestChanges" for sending change emails', function (done) {
      sinon.stub(gitExec, 'command', function (args, callback) {
        if (args[0] === 'log') {
          callback(null, '60ca4ed\n' +
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
            'no comment\n');
        }
      });
      Git.latestChanges('path', moment(), function (err, metadatas) {
        expect(metadatas).to.have.length(3);
        expect(metadatas[0].hashRef).to.equal('f327d71');
        expect(metadatas[1].hashRef).to.equal('19c89ae');
        expect(metadatas[2].hashRef).to.equal('60ca4ed');
        done(err);
      });
    });

    it('calls the callback with an error when failing at "latestChanges"', function (done) {
      sinon.stub(gitExec, 'command', (args, callback) => callback(new Error()));
      Git.latestChanges('path', moment(), function (err) {
        expect(err).to.exist();
        done();
      });
    });
  });

  const runTestsFor = function (commandName, gitmechCommand) {
    return function () {
      it('calls commit when successful', function (done) {
        var commitcalled = false;
        sinon.stub(gitExec, 'command', function (args, callback) {
          if (args[0] === commandName) { callback(null); }
          if (args[0] === 'commit') {
            commitcalled = true;
            callback(null);
          }
        });
        gitmechCommand('message', 'author', function (err) {
          expect(err).to.be(null);
          expect(commitcalled).to.be(true);
          done(err);
        });
      });

      it('does not call commit when failing', function (done) {
        var commitcalled = false;
        sinon.stub(gitExec, 'command', function (args, callback) {
          if (args[0] === commandName) { callback(new Error()); }
          if (args[0] === 'commit') {
            commitcalled = true;
            callback(null);
          }
        });
        gitmechCommand('message', 'author', function (err) {
          expect(err).to.exist();
          expect(commitcalled).to.be(false);
          done();
        });
      });

      it('handles "commit" errors', function (done) {
        var commitcalled = false;
        sinon.stub(gitExec, 'command', function (args, callback) {
          if (args[0] === commandName) { callback(null); }
          if (args[0] === 'commit') {
            commitcalled = true;
            callback(new Error());
          }
        });
        gitmechCommand('message', 'author', function (err) {
          expect(err).to.exist();
          expect(commitcalled).to.be(true);
          done();
        });
      });
    };
  };

  describe(' - write operations', function () {
    describe('"add" command', runTestsFor('add', R.partial(Git.add, ['path'])));
    describe('"rm" command', runTestsFor('rm', R.partial(Git.rm, ['path'])));
    describe('"mv" command', runTestsFor('mv', R.partial(Git.mv, ['oldpath', 'newpath'])));
  });

  describe(' - searching', function () {
    it('finds in file contents', function (done) {
      sinon.stub(gitExec, 'command', function (args, callback) {
        if (args[0] === 'grep') {
          callback(null, 'global/index.md:8:Dies ist der Index [für] das [[andreas:test]] -dudelo\n' +
            'global/veran.md:12:[UK Tester Forums - Test Management Forum](http://uktmf.com/index.php?q=node/5271)                                             | London                  | 5.2.             \n' +
            'global/veran.md:16:[Belgium Testing Days](http://btdconf.com/)                                                                                    | Brügge                  | 17.3. - 20.3.    \n' +
            'global/veran.md:20:[SIGIST (Specialist Group in Software Testing) Spring Conference](http://www.bcs.org/category/9264)                            | London                  | 11.3.            ');
        }
        if (args[0] === 'ls-files') {
          callback();
        }
      });
      Git.grep('test', function (err, chunks) {
        expect(chunks).to.have.length(4);
        expect(chunks).to.contain('global/veran.md:16:[Belgium Testing Days](http://btdconf.com/)                                                                                    | Brügge                  | 17.3. - 20.3.    ');
        done(err);
      });
    });

    it('finds in file names', function (done) {
      sinon.stub(gitExec, 'command', function (args, callback) {
        if (args[0] === 'grep') {
          callback();
        }
        if (args[0] === 'ls-files') {
          callback(null, 'andex.md\n' +
            'andreas.md\n' +
            'andreastest.md');
        }
      });
      Git.grep('test', function (err, chunks) {
        expect(chunks).to.have.length(3);
        expect(chunks).to.contain('andex.md');
        done(err);
      });
    });

    it('handles errors in grep search with more than two lines', function (done) {
      sinon.stub(gitExec, 'command', function (args, callback) {
        if (args[0] === 'grep') { callback(new Error('line1\nline2\nline3')); }
      });
      Git.grep('test', function (err) {
        expect(err).to.exist();
        done();
      });
    });

    it('handles errors in grep search with less than two lines', function (done) {
      sinon.stub(gitExec, 'command', function (args, callback) {
        if (args[0] === 'grep') { callback(new Error('line1\nline2')); }
      });
      Git.grep('test', function (err, result) {
        expect(err).to.not.exist();
        expect(result).to.eql([]);
        done();
      });
    });

    it('handles errors in file search', function (done) {
      sinon.stub(gitExec, 'command', function (args, callback) {
        if (args[0] === 'grep') { callback(); }
        if (args[0] === 'ls-files') { callback(new Error()); }
      });
      Git.grep('test', function (err) {
        expect(err).to.exist();
        done();
      });
    });
  });

  describe(' - listing files', function () {
    it('"ls" - converts the data to an array of single non empty lines', function (done) {
      sinon.stub(gitExec, 'command', function (args, callback) {
        if (args[0] === 'ls-tree') {
          callback(null, 'andex.md\n' +
            '\n' +
            'andreastest.md');
        }
      });
      Git.ls('subdir', function (err, lines) {
        expect(err).to.not.exist();
        expect(lines).to.have.length(2);
        done();
      });
    });

    it('"ls" - handles errors correct', function (done) {
      sinon.stub(gitExec, 'command', function (args, callback) {
        if (args[0] === 'ls-tree') { callback(new Error()); }
      });
      Git.ls('subdir', function (err) {
        expect(err).to.exist();
        done();
      });
    });

    it('"lsdirs" - converts the data to an array of single non empty lines', function (done) {
      sinon.stub(gitExec, 'command', function (args, callback) {
        if (args[0] === 'ls-tree') {
          callback(null, 'andex.md\n' +
            '\n' +
            'andreastest.md');
        }
      });
      Git.lsdirs(function (err, lines) {
        expect(err).to.not.exist();
        expect(lines).to.have.length(2);
        done();
      });
    });

    it('"lsdirs" - handles errors correct', function (done) {
      sinon.stub(gitExec, 'command', function (args, callback) {
        if (args[0] === 'ls-tree') { callback(new Error()); }
      });
      Git.lsdirs(function (err) {
        expect(err).to.exist();
        done();
      });
    });

    it('"lsblogposts" - converts the data to an array of single non empty lines', function (done) {
      sinon.stub(gitExec, 'command', function (args, callback) {
        if (args[0] === 'ls-files') {
          callback(null, 'andex.md\n' +
            '\n' +
            'andreastest.md');
        }
      });
      Git.lsblogposts('group', 'pattern', function (err, lines) {
        expect(err).to.not.exist();
        expect(lines).to.have.length(2);
        done();
      });
    });

    it('"lsblogposts" - handles errors correct', function (done) {
      sinon.stub(gitExec, 'command', function (args, callback) {
        if (args[0] === 'ls-files') { callback(new Error()); }
      });
      Git.lsblogposts('group', 'pattern', function (err) {
        expect(err).to.exist();
        done();
      });
    });
  });
});
