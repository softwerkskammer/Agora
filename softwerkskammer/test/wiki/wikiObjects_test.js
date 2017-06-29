'use strict';

const expect = require('must-dist');
const moment = require('moment-timezone');
const beans = require('../../testutil/configureForTest').get('beans');
const wikiObjects = beans.get('wikiObjects');
const FileWithChangelist = wikiObjects.FileWithChangelist;
const DirectoryWithChangedFiles = wikiObjects.DirectoryWithChangedFiles;
const Metadata = wikiObjects.Metadata;
const Blogpost = wikiObjects.Blogpost;
const Diff = beans.get('gitDiff');

describe('Wiki Objects', () => {

  it('is a structure representing changes', () => {
    const dirWithChangedFiles = new DirectoryWithChangedFiles({dir: 'directory', files: []});
    dirWithChangedFiles.addFile(new FileWithChangelist({
      file: 'name1',
      changelist: [
        new Metadata({author: 'metaauthor1'}),
        new Metadata({author: 'metaauthor12'}),
        new Metadata({author: 'metaauthor12'})
      ],
      diff: new Diff('')
    }));
    dirWithChangedFiles.addFile(new FileWithChangelist({
      file: 'name0',
      changelist: [new Metadata({author: 'metaauthor2'})],
      diff: new Diff('')
    }));
    expect(dirWithChangedFiles.sortedFiles()[0].file).is('name0');
    expect(dirWithChangedFiles.sortedFiles()[1].file).is('name1');
    expect(dirWithChangedFiles.sortedFiles()[1].authorsString()).is('metaauthor1,metaauthor12');
  });

  it('(metadata) converts filenames', () => {
    const meta = new Metadata({name: 'path/file.md'});
    expect(meta.pureName()).is('file');
    expect(meta.dialogId()).is('path-file');
    expect(meta.url()).is('/wiki/path/file');
    expect(meta.dialogUrl()).is('/wiki/modal/path/file');
  });
});

describe('BlogPost', () => {
  const datum = moment('2013-02-01', 'YYYY-MM-DD');

  it('returns a parsed blog post', () => {
    const post = '#Lean Coffee _Februar_ 2013\n ' +
      '\n' +
      'Und beim nächsten Mal haben wir dann.\n' +
      '\n' +
      'Diesen Blog gemacht.';
    const path = 'blog_2013-02-01LeanCoffeeTest.md';

    const result = new Blogpost(path, post);

    expect(result.title).is('Lean Coffee _Februar_ 2013');
    expect(result.date().isSame(datum)).to.be.true();
    expect(result.teaser).is('<p>Und beim nächsten Mal haben wir dann.</p>\n');
  });

  it('is not valid for empty input', () => {
    expect(new Blogpost('', '').isValid()).to.be.false();
  });

  it('is not valid if the date in the path is malformed', () => {
    expect(new Blogpost('blog_2000-01-0LeanCoffeeTest.md', 'post').isValid()).to.be.false();
  });

  it('returns properly if body is missing', () => {
    const result = new Blogpost('blog_2013-02-01LeanCoffeeTest.md', '#Lean Coffee Februar 2013');

    expect(result.title).is('Lean Coffee Februar 2013');
    expect(result.teaser).to.be.undefined();
    expect(result.date().isValid()).to.be.true();
  });

  it('can parse a multitude of titles', () => {
    function parseTitle(post) {
      return new Blogpost('blog_2013-02-01LeanCoffeeTest.md', post).title;
    }

    expect(parseTitle('#Lean Coffee 2013')).is('Lean Coffee 2013');
    expect(parseTitle('#####Lean Coffee 2013')).is('Lean Coffee 2013');
    expect(parseTitle('#####   Lean Coffee 2013')).is('Lean Coffee 2013');
    expect(parseTitle('    #####   Lean Coffee 2013')).is('Lean Coffee 2013');
    expect(parseTitle('    #   Lean Coffee 2013')).is('Lean Coffee 2013');
    expect(parseTitle('       Lean Coffee 2013')).is('Lean Coffee 2013');
    expect(parseTitle('    ##   Lean# Coffee 2013')).is('Lean# Coffee 2013');
  });

  it('can parse a multitude of content', () => {
    function parse(post) { return new Blogpost('blog_2013-02-01LeanCoffeeTest.md', post); }

    expect(parse('# Lean\n\nblank').title).is('Lean');
    expect(parse('# Lean\n\nblank').teaser).is('<p>blank</p>\n');

    expect(parse('# Lean\nblitz\nblank').title).is('Lean');
    expect(parse('# Lean\nblitz\nblank').teaser).is('<p>blitz<br>blank</p>\n');

    expect(parse('Lean\n====\n\nblank').title).is('Lean');
    expect(parse('Lean\n====\n\nblank').teaser).is('<p>blank</p>\n');
  });

  it('can parse a multitude of date variants', () => {
    function parseDate(datestring) {
      return new Blogpost('blog_' + datestring + 'LeanCoffeeTest.md', '#Lean').date();
    }

    expect(parseDate('2013-02-01').isSame(datum)).to.be.true();
    expect(parseDate('2013-02-1').isSame(datum)).to.be.true();
    expect(parseDate('2013-2-1').isSame(datum)).to.be.true();
  });

  it('has reasonable url functions', () => {
    const result = new Blogpost('path/file.md', '#Lean Coffee Februar 2013');
    expect(result.pureName()).is('Lean Coffee Februar 2013');
    expect(result.dialogId()).is('path-file');
    expect(result.url()).is('/wiki/path/file');
    expect(result.dialogUrl()).is('/wiki/modal/path/file');
  });

  it('can parse links inside the teaser', () => {
    function parse(post) { return new Blogpost('blog_2013-02-01LeanCoffeeTest.md', post); }

    expect(parse('# Dummy\n\n[Some Link](http://www.google.de)').teaser).is('<p><a href="http://www.google.de">Some Link</a></p>\n');

  });


});
