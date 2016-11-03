'use strict';
const moment = require('moment-timezone');
const R = require('ramda');
const path = require('path');

const beans = require('simple-configure').get('beans');
const Renderer = beans.get('renderer');

const BLOG_ENTRY_REGEX = /blog_(\d{4}-\d{1,2}-\d{1,2})/;

function pathFunctions(name) {
  return {
    dialogUrl: function () { return '/wiki/modal/' + this.dialogId('/'); },
    url: function () { return '/wiki/' + this.dialogId('/'); },
    dialogId: function (separator) { return path.dirname(name) + (separator || '-') + path.basename(name, '.md'); }
  };
}

class Metadata {
  constructor(object) {
    this.name = object.name;
    this.hashRef = object.hashRef;
    this.fullhash = object.fullhash;
    this.author = object.author;
    this.datestring = object.date;
    this.comment = object.comment;

    const pf = pathFunctions(this.name);
    this.dialogId = pf.dialogId;
    this.dialogUrl = pf.dialogUrl;
    this.url = pf.url;
  }

  date() { return moment(this.datestring, 'YYYY-MM-DD hh:mm:ss ZZ'); }

  pureName() { return path.basename(this.name, '.md'); }
}

class Blogpost {
  constructor(name, post) {
    this.name = name;
    this.title = Renderer.firstTokentextOf(post).replace(/^(#|\s)*/, '');
    this.teaser = Renderer.secondTokentextOf(post);

    const match = name.match(BLOG_ENTRY_REGEX);
    this.datestring = match && match[1];

    const pf = pathFunctions(this.name);
    this.dialogId = pf.dialogId;
    this.dialogUrl = pf.dialogUrl;
    this.url = pf.url;
  }

  isValid() { return !!this.title && this.date().isValid(); }

  date() { return moment(this.datestring, 'YYYY-MM-DD'); }

  pureName() { return this.title; }
}

class FileWithChangelist {
  constructor(object) {
    this.file = object.file;
    this.changelist = object.changelist;
    this.diff = object.diff;
  }

  authorsString() { return R.uniq(this.changelist.map(change => change.author)).toString(); }
}

class DirectoryWithChangedFiles {
  constructor(object) {
    this.dir = object.dir;
    this.files = object.files;
  }

  sortedFiles() { return this.files.sort((a, b) => {return a.file.localeCompare(b.file);}); }

  addFile (fileWithChanges) { this.files.push(fileWithChanges); }
}

module.exports.Metadata = Metadata;
module.exports.Blogpost = Blogpost;
module.exports.FileWithChangelist = FileWithChangelist;
module.exports.DirectoryWithChangedFiles = DirectoryWithChangedFiles;
module.exports.BLOG_ENTRY_REGEX = BLOG_ENTRY_REGEX;
