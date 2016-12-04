'use strict';

const sinon = require('sinon').sandbox.create();
const expect = require('must-dist');
const beans = require('../../testutil/configureForTest').get('beans');
const wikiService = beans.get('wikiService');
const moment = require('moment-timezone');
const Git = beans.get('gitmech');

describe('Wiki Service', () => {

  const content = 'Hallo, ich bin der Dateiinhalt';
  const nonExistingPage = 'global/nonExisting';

  beforeEach(() => {
    sinon.stub(Git, 'readFile', (completePageName, pageVersion, callback) => {
      if (completePageName === nonExistingPage + '.md') {
        return callback(new Error());
      }
      callback(null, content);
    });
    sinon.stub(Git, 'log', (path, version, howMany, callback) => {
      callback(null, []);
    });
    sinon.stub(Git, 'absPath', path => path);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('(showPage)', () => {
    it('returns content for a requested existing page', done => {
      wikiService.showPage('pageName', '11', (err, cont) => {
        expect(content).to.equal(cont);
        done(err);
      });
    });

    it('returns an error if the requested page is not found', done => {
      wikiService.showPage(nonExistingPage, '11', (err, cont) => {
        expect(err).to.exist();
        expect(cont).to.not.exist();
        done(); // error condition - do not pass err
      });
    });
  });

  describe('(editPage)', () => {
    it('indicates that the file is none existent', done => {
      wikiService.pageEdit('pageName', (err, cont, metadata) => {
        expect('').to.equal(cont);
        expect(metadata).to.contain('NEW');
        done(err);
      });
    });

    it('returns the content of the file to edit if it exists', done => {
      wikiService.pageEdit('README', (err, cont, metadata) => {
        expect(cont).to.equal(content);
        expect(metadata).to.be.empty();
        done(err);
      });
    });
  });

});

describe('WikiService (list for dashboard)', () => {
  beforeEach(() => {
    const metadatas = [
      {
        'name': 'craftsmanswap/index.md',
        'hashRef': 'HEAD',
        'fullhash': 'baa6d36a37f0f04e1e88b4b57f0d89893789686c',
        'author': 'leider',
        'datestring': '2014-04-30 17:25:48 +0200',
        'comment': 'no comment'
      },
      {
        'name': 'craftsmanswap/index.md',
        'hashRef': 'e6eb66c',
        'fullhash': 'e6eb66c3f666888da4b0da3f9207d88e996e8bf5',
        'author': 'leider',
        'datestring': '2014-04-30 17:25:37 +0200',
        'comment': 'no comment'
      },
      {
        'name': 'craftsmanswap/blog_2014-03-19_der_blog.md',
        'hashRef': '643e958',
        'fullhash': '643e958937540da5907f7d32d87647cb5773e626',
        'author': 'leider',
        'datestring': '2014-03-27 22:39:03 +0100',
        'comment': 'no comment'
      },
      {
        'name': 'craftsmanswap/blog_2014-03-19_der_blog.md',
        'hashRef': 'a3ab0d7',
        'fullhash': 'a3ab0d79e3958e21b0367bc952a04596e7892739',
        'author': 'leider',
        'datestring': '2014-03-27 22:38:04 +0100',
        'comment': 'no comment'
      },
      {
        'name': 'craftsmanswap/index.md',
        'hashRef': 'f327d71',
        'fullhash': 'f327d711e3e8f0104cde2902198512444af46df3',
        'author': 'leider',
        'datestring': '2014-03-09 14:37:59 +0100',
        'comment': 'no comment'
      },
      {
        'name': 'craftsmanswap/blog_vonmorgen.md',
        'hashRef': '370dd3c',
        'fullhash': '370dd3ce2e09fe74a78be8f8a10d36e7a3d8975b',
        'author': 'trauerleider',
        'datestring': '2014-02-13 08:26:01 +0100',
        'comment': 'no comment'
      },
      {
        'name': 'craftsmanswap/index.md',
        'hashRef': '2c0a379',
        'fullhash': '2c0a379a5497d0998ac2ffcad4cc4261fb0a19c3',
        'author': 'leider',
        'datestring': '2013-12-21 23:06:13 +0100',
        'comment': 'no comment'
      }
    ];
    sinon.stub(Git, 'log', (path, version, howMany, callback) => {
      callback(null, metadatas);
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('removes duplicate entries and blogposts for the dashboard', done => {
    wikiService.listChangedFilesinDirectory('craftsmanswap', (err, metadata) => {
      expect(metadata).to.have.length(2);
      expect(metadata[0].name).to.equal('craftsmanswap/index.md');
      expect(metadata[0].datestring).to.equal('2014-04-30 17:25:48 +0200');
      expect(metadata[1].name).to.equal('craftsmanswap/blog_vonmorgen.md');
      expect(metadata[1].datestring).to.equal('2014-02-13 08:26:01 +0100');
      done(err);
    });
  });

});
//This is an extra group because the Git.readFile mock has a different objective
describe('WikiService (getBlogPosts)', () => {

  beforeEach(() => {
    sinon.stub(Git, 'lsblogposts', (groupname, pattern, callback) => {
      if (groupname === 'internet') {
        callback(null, ['internet/blog_2013-10-01AgoraCodeKata.md', 'internet/blog_2013-11-01LeanCoffeeTest.md']);
      } else if (groupname === 'alle') {
        callback(null, []);
      } else if (groupname === 'error') {
        callback(null, ['error/blog_2013-10-01.md', 'error/blog_notadate.md', 'error/blog_2013-05-01.md', 'error/blog_2013-05-1.md', 'error/blog_2013-5-01.md', 'error/blog_.md']);
      }
    });
    sinon.stub(Git, 'readFileFs', (path, callback) => {
      if (path === 'internet/blog_2013-11-01LeanCoffeeTest.md') {
        callback(null,
          '####   Lean Coffee November 2013\n' +
          '\n' +
          'Und beim nächsten Mal haben wir dann.\n' +
          '\n' +
          'Diesen Blog gemacht.');
      } else if (path === 'internet/blog_2013-10-01AgoraCodeKata.md') {
        callback(null,
          'Agora Code-Kata Oktober 2013\n' +
          '\n' +
          'Weil viele uns weder JavaScript noch populäre JavaScript...\n' +
          '\n' +
          'Leider hatten wir vorher keine Anweisungen herumgeschickt, ...');
      } else if (path === 'error/blog_2013-10-01.md') {
        callback(null, '#1');
      } else if (path === 'error/blog_notadate.md') {
        callback(null, '#2');
      } else if (path === 'error/blog_2013-05-01.md') {
        callback(null, '#3');
      } else if (path === 'error/blog_2013-05-1.md') {
        callback(null, '#4');
      } else if (path === 'error/blog_2013-5-01.md') {
        callback(null, '#5');
      } else if (path === 'error/blog_.md') {
        callback(null, '');
      }

    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('returns two properly parsed blog posts for the group internet', done => {
    wikiService.getBlogpostsForGroup('internet', (err, result) => {
      expect(result.length === 2).to.be(true);

      const post1 = result[0];
      expect(post1.title).to.equal('Lean Coffee November 2013');
      expect(post1.teaser).to.equal('Und beim nächsten Mal haben wir dann.');
      expect(post1.dialogId()).to.equal('internet-blog_2013-11-01LeanCoffeeTest');
      expect(post1.date().isSame(moment('2013-11-01'))).to.be(true);

      const post2 = result[1];
      expect(post2.title).to.equal('Agora Code-Kata Oktober 2013');
      expect(post2.teaser).to.equal('Weil viele uns weder JavaScript noch populäre JavaScript...');
      expect(post2.dialogId()).to.equal('internet-blog_2013-10-01AgoraCodeKata');
      expect(post2.date().isSame(moment('2013-10-01'))).to.be(true);

      done(err);
    });
  });

  it('returns no blog posts if there are none', done => {
    wikiService.getBlogpostsForGroup('alle', (err, result) => {
      expect(result.length === 0).to.be(true);
      done(err);
    });
  });

  it('skips empty posts and posts without proper date', done => {
    wikiService.getBlogpostsForGroup('error', (err, result) => {
      expect(result.length).to.equal(4);
      const titles = result.map(post => post.title);
      expect(titles).to.contain('1');
      expect(titles).to.contain('3');
      expect(titles).to.contain('4');
      expect(titles).to.contain('5');
      done(err);
    });
  });
});

describe('WikiService (parseBlogPost)', () => {

  it('returns undefined when Blogpost invalid', () => {
    expect(wikiService.parseBlogPost('', '')).to.be.undefined();
  });

  it('returns the Blogpost if it is valid', () => {
    expect(wikiService.parseBlogPost('blog_2013-11-01LeanCoffeeTest.md', '#Lean Coffee November 2013')).to.not.be.undefined();
  });
});

describe('Wiki Service (daily digest)', () => {

  const subdirs = ['dirA', 'dirB'];
  const filesForDirA = ['dirA/fileA1', 'dirA/fileA2'];
  const filesForDirB = ['dirB/fileB1', 'dirB/fileB2'];
  const metadataA1 = {author: 'authorA1', fullhash: 'hashA1', date: '2014-01-11 18:45:29 +0100'};
  const metadataA2 = {author: 'authorA2', fullhash: 'hashA2', date: '2014-01-10 18:45:29 +0100'};
  const metadataB1 = {author: 'authorB1', fullhash: 'hashB1', date: '2014-01-11 18:45:29 +0100'};

  beforeEach(() => {
    sinon.stub(Git, 'ls', (dirname, callback) => {
      if (dirname === 'dirA') { return callback(null, filesForDirA); }
      if (dirname === 'dirB') { return callback(null, filesForDirB); }
    });

    sinon.stub(Git, 'latestChanges', (filename, someMoment, callback) => {
      if (filename.indexOf('A1') > -1) { return callback(null, [metadataA1]); }
      if (filename.indexOf('A2') > -1) { return callback(null, [metadataA2]); }
      if (filename.indexOf('B1') > -1) { return callback(null, [metadataB1]); }
      callback(null, []);
    });

    sinon.stub(Git, 'readFile', (filename, tag, callback) => {
      callback(null);
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Digest', () => {
    it('finds all changed pages', done => {
      sinon.stub(Git, 'lsdirs', callback => {
        callback(null, subdirs);
      });

      sinon.stub(Git, 'diff', (path, revisions, callback) => {
        callback(null, '');
      });

      wikiService.findPagesForDigestSince(moment(), (err, pages) => {
        expect(pages.length).to.equal(2);
        pages.forEach(page => {
          if (page.dir === 'dirA') {
            expect(page.files.length).to.equal(2);
          } else {
            expect(page.files.length).to.equal(1);
          }
        });
        done(err);
      });
    });

    it('handles an error correctly', done => {
      sinon.stub(Git, 'lsdirs', callback => {
        callback(new Error());
      });

      wikiService.findPagesForDigestSince(moment(), err => {
        expect(err).to.exist();
        done();
      });
    });
  });
});
