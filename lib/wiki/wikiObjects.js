"use strict";
var _ = require('lodash');

function Metadata(object) {
  this.name = object.name;
  this.hashRef = object.hashRef;
  this.fullhash = object.fullhash;
  this.author = object.author;
  this.date = object.date;
  this.comment = object.comment;
}

function FileWithChangelist(object) {
  this.file = object.file;
  this.changelist = object.changelist;
  this.diff = object.diff;
}

FileWithChangelist.prototype.authorsString = function () {
  return _(this.changelist).pluck('author').uniq().value().toString();
};

function DirectoryWithChangedFiles(object) {
  this.dir = object.dir;
  this.files = object.files;
}

DirectoryWithChangedFiles.prototype.sortedFiles = function () {
  return _.sortBy(this.files, 'file');
};

DirectoryWithChangedFiles.prototype.addFile = function (fileWithChanges) {
  this.files.push(fileWithChanges);
};



module.exports.Metadata = Metadata;
module.exports.FileWithChangelist = FileWithChangelist;
module.exports.DirectoryWithChangedFiles = DirectoryWithChangedFiles;
