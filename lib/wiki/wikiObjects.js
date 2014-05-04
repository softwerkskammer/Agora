"use strict";
var moment = require('moment-timezone');
var _ = require('lodash');
var path = require('path');

var BLOG_ENTRY_REGEX = /blog_(\d{4}-\d{1,2}-\d{1,2})/;

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

Metadata.prototype.url = function () {
  return '/wiki/' + path.dirname(this.name) + '/' + this.pureName();
};

Metadata.prototype.dialogUrl = function () {
  return '/wiki/modal/' + path.dirname(this.name) + '/' + this.pureName();
};

Metadata.prototype.dialogId = function () {
  return path.dirname(this.name) + '-' + this.pureName();
};

function Blogpost(path, post) {
  var splitLines = post.split('\n');
  var title = splitLines[0];
  var teaser = splitLines[2];

  var match = path.match(BLOG_ENTRY_REGEX);

  this.valid = false;
  if (match === null) {
    return;
  }

  if (!moment(match[1], 'YYYY-MM-DD').isValid()) {
    return;
  }

  if (title === '' || title === undefined) {
    return;
  }

  this.valid = true;
  this.title = title.replace(/^(#|\s)*/, '');
  this.datestring = match[1];
  this.path = path.substring(0, path.length - 3);
  this.name = path;
  this.teaser = teaser;
}

Blogpost.prototype.date = function () {
  return moment(this.datestring, 'YYYY-MM-DD');
};

Blogpost.prototype.pureName = function () {
  return this.title;
};

Blogpost.prototype.url = function () {
  return '/wiki/' + path.dirname(this.name) + '/' + path.basename(this.name, '.md');
};

Blogpost.prototype.dialogUrl = function () {
  return '/wiki/modal/' + path.dirname(this.name) + '/' + path.basename(this.name, '.md');
};

Blogpost.prototype.dialogId = function () {
  return path.dirname(this.name) + '-' + path.basename(this.name, '.md');
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
module.exports.Blogpost = Blogpost;
module.exports.FileWithChangelist = FileWithChangelist;
module.exports.DirectoryWithChangedFiles = DirectoryWithChangedFiles;
module.exports.BLOG_ENTRY_REGEX = BLOG_ENTRY_REGEX;
