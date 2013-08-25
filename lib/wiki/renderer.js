"use strict";
var marked = require('marked');
var Crypto = require('crypto');
var Nsh = require('node-syntaxhighlighter');

marked.setOptions({
  gfm: true,
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

    tagmap[k] = '<a class="internal" href="/wiki/' + subdir + '/' + encodeURIComponent(pageName.toLowerCase()) + '">' + name + ''</a>';
  }

  for (k in tagmap) {
    re = new RegExp(k, 'g');
    text = text.replace(re, tagmap[k]);
  }

  return text;
}

var Renderer = {
  render: function (content, subdir) {
    return marked(evalTags(extractTags(content), subdir));
  }
};

module.exports = Renderer;
