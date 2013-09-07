"use strict";
var marked = require('marked');
var Crypto = require('crypto');
var Nsh = require('node-syntaxhighlighter');
var iconv = new require("iconv").Iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE');

var normalise = function (str) {
  if (typeof str !== 'string' || str.trim() === "") {
    return "";
  }
  return iconv.convert(str).toString().trim().replace(/\s/g, '-').replace(/\//g, '-').replace(/[^a-zA-Z0-9\- _]/g, "").toLowerCase();
};

marked.setOptions({
  gfm: true,
  tables: true,
  breaks: true,
  smartLists: true,
  pedantic: false,
  sanitize: false, // To be able to add iframes 
  highlight: function (code, lang) {
    return Nsh.highlight(code, Nsh.getLanguage(lang || 'text'), {gutter: !!lang});
  }
});

var tagmap = {};

// Yields the content with the rendered [[bracket tags]]
// The rules are the same for Gollum https://github.com/github/gollum
function extractTags(text) {

  tagmap = {};

  var matches = text.match(/(.?)\[\[(.+?)\]\]([^\[]?)/g);
  var tag;
  var id;

  if (matches) {
    matches.forEach(function (match) {
      match = match.trim();
      tag = /(.?)\[\[(.+?)\]\](.?)/.exec(match);
      if (tag[1] === '\'') {
        return;
      }
      id = Crypto.createHash('sha1').update(tag[2]).digest('hex');
      tagmap[id] = tag[2];
      text = text.replace(tag[0], id);
    });

  }
  return text;
}

function evalTags(text, subdir) {

  var parts;
  var name;
  var pageName;
  var re;

  for (var k in tagmap) {
    parts = tagmap[k].split('|');
    name = pageName = parts[0];
    if (parts[1]) {
      pageName = parts[1];
    }

    tagmap[k] = '<a class="internal" href="/wiki/' + (subdir ? subdir : 'global') + '/' + normalise(pageName.toLowerCase()) + '">' + name + '</a>';
  }

  for (k in tagmap) {
    re = new RegExp(k, 'g');
    text = text.replace(re, tagmap[k]);
  }

  return text;
}

var Renderer = {
  render: function (content, subdir) {
    var rendered = marked(evalTags(extractTags(content), subdir));
    return rendered.replace('<table>', '<table class="table table-condensed table-hover table-striped">');
  },

  normalize: normalise
};

module.exports = Renderer;
