"use strict";

var expect = require('chai').expect;

var beans = require('../configureForTest').get('beans');
var wikiObjects = beans.get('wikiObjects');
var FileWithChangelist = wikiObjects.FileWithChangelist;
var DirectoryWithChangedFiles = wikiObjects.DirectoryWithChangedFiles;
var Metadata = wikiObjects.Metadata;
var Diff = beans.get('gitDiff');

describe('Wiki Objects', function () {

  it('is a structure representing changes', function () {
    var metadata = [new Metadata({ author: 'metaauthor' })];

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

});
