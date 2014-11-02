'use strict';

var expect = require('must');

var beans = require('../../testutil/configureForTest').get('beans');
var wikiObjects = beans.get('wikiObjects');
var FileWithChangelist = wikiObjects.FileWithChangelist;
var DirectoryWithChangedFiles = wikiObjects.DirectoryWithChangedFiles;
var Metadata = wikiObjects.Metadata;
var Diff = beans.get('gitDiff');

describe('Wiki Objects', function () {

  it('is a structure representing changes', function () {
    var dirWithChangedFiles = new DirectoryWithChangedFiles({dir: 'directory', files: []});
    dirWithChangedFiles.addFile(new FileWithChangelist({file: 'name1', changelist: [
      new Metadata({ author: 'metaauthor1' }),
      new Metadata({ author: 'metaauthor12' }),
      new Metadata({ author: 'metaauthor12' })
    ], diff: new Diff('')}));
    dirWithChangedFiles.addFile(new FileWithChangelist({file: 'name0', changelist: [new Metadata({ author: 'metaauthor2' })], diff: new Diff('')}));
    expect(dirWithChangedFiles.sortedFiles()[0].file).to.equal('name0');
    expect(dirWithChangedFiles.sortedFiles()[1].file).to.equal('name1');
    expect(dirWithChangedFiles.sortedFiles()[1].authorsString()).to.equal('metaauthor1,metaauthor12');
  });

  it('(metadata) converts filenames', function () {
    var meta = new Metadata({name: 'path/file.md'});
    expect(meta.pureName()).to.equal('file');
  });
});
