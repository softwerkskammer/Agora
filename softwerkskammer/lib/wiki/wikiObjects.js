'use strict';
var moment = require('moment-timezone');
var _ = require('lodash');
var path = require('path');

var beans = require('simple-configure').get('beans');
var Renderer = beans.get('renderer');

var BLOG_ENTRY_REGEX = /blog_(\d{4}-\d{1,2}-\d{1,2})/;

var pathFunctions = function (name) {
  return {
    dialogUrl: function () { return '/wiki/modal/' + this.dialogId('/'); },
    url: function () { return '/wiki/' + this.dialogId('/'); },
    dialogId: function (separator) { return path.dirname(name) + (separator || '-') + path.basename(name, '.md'); }
  };
};

function Metadata(object) {
  this.name = object.name;
  this.hashRef = object.hashRef;
  this.fullhash = object.fullhash;
  this.author = object.author;
  this.datestring = object.date;
  this.comment = object.comment;

  var pf = pathFunctions(this.name);
  this.dialogId = pf.dialogId;
  this.dialogUrl = pf.dialogUrl;
  this.url = pf.url;
}

Metadata.prototype.date = function () {
  return moment(this.datestring, 'YYYY-MM-DD hh:mm:ss ZZ');
};

Metadata.prototype.pureName = function () {
  return path.basename(this.name, '.md');
};

function Blogpost(name, post) {
  this.name = name;
  this.title = Renderer.firstTokentextOf(post).replace(/^(#|\s)*/, '');
  this.teaser = Renderer.secondTokentextOf(post);

  var match = name.match(BLOG_ENTRY_REGEX);
  this.datestring = match && match[1];

  var pf = pathFunctions(this.name);
  this.dialogId = pf.dialogId;
  this.dialogUrl = pf.dialogUrl;
  this.url = pf.url;
}

Blogpost.prototype.isValid = function () {
  return !!this.title && this.date().isValid();
};

Blogpost.prototype.date = function () {
  return moment(this.datestring, 'YYYY-MM-DD');
};

Blogpost.prototype.pureName = function () {
  return this.title;
};

function FileWithChangelist(object) {
  this.file = object.file;
  this.changelist = object.changelist;
  this.diff = object.diff;
}

FileWithChangelist.prototype.authorsString = function () {
  return _(this.changelist).map('author').uniq().value().toString();
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
