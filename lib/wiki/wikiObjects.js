"use strict";
var _ = require('lodash');
var conf = require('nconf');

function Metadata(object) {
  this.name = object.name;
  this.hashRef = object.hashRef;
  this.fullhash = object.fullhash;
  this.author = object.author;
  this.date = object.date;
  this.comment = object.comment;
}

function FileWithChangelist(object) {
  this.dir = object.dir;
  this.file = object.file;
  this.changelist = object.changelist;
  this.diff = object.diff;
}

function DirectoryWithChangedFiles(object) {
  this.dir = object.dir;
  this.files = object.files;
}

FileWithChangelist.prototype.displayText = function () {
  return 'Seite: ' + this.file + '\n' + conf.get('publicUrlPrefix') + '/wiki/' +
    this.dir + '/' + this.file +
    '\n\n' + this.diff.diff + '\n===\n';
};

DirectoryWithChangedFiles.prototype.changetext = function () {
  return 'Verzeichnis: ' + this.dir + '\n' + _.reduce(this.sortedFiles(), function (result, current) {
    return result + current.displayText();
  }, '');
};

DirectoryWithChangedFiles.prototype.sortedFiles = function () {
  return _.sortBy(this.files, 'file');
};

DirectoryWithChangedFiles.prototype.addFile = function (fileWithChanges) {
  this.files.push(fileWithChanges);
};

module.exports.Metadata = Metadata;
module.exports.FileWithChangelist = FileWithChangelist;
module.exports.DirectoryWithChangedFiles = DirectoryWithChangedFiles;
