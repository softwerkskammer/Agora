"use strict";
var moment = require('moment-timezone');
var _ = require('lodash');
var path = require('path');

function Metadata(object) {
  this.name = object.name;
  this.hashRef = object.hashRef;
  this.fullhash = object.fullhash;
  this.author = object.author;
  this.datestring = object.date;
  this.comment = object.comment;
}

Metadata.prototype.date = function () {
  return moment(this.datestring, 'YYYY-MM-DD hh:mm:ss ZZ');
};

Metadata.prototype.pureName = function () {
  return path.basename(this.name, '.md');
};

Metadata.prototype.dirname = function () {
  return path.dirname(this.name);
};

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
