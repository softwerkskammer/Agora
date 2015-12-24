'use strict';
var marked = require('marked');
var Crypto = require('crypto');
var Nsh = require('node-syntaxhighlighter');
var iconv = require('iconv-lite');
var _ = require('lodash');

var normalize = function (str) {
  if (typeof str !== 'string' || str.trim() === '') {
    return '';
  }
  // iconv-lite cannot do this yet, so we do it manually:
  var withoutUmlauts = str.replace(/[äÄàáÀÁâÂ]/gi, 'a')
    .replace(/[èéÈÉêÊ]/gi, 'e')
    .replace(/[ìíÌÍîÎ]/gi, 'i')
    .replace(/[öÖòóÒÓôÔ]/gi, 'o')
    .replace(/[üÜùúÙÚûÛ]/gi, 'u')
    .replace(/ß/g, 's');
  return iconv.decode(new Buffer(withoutUmlauts, 'utf-8'), 'utf8').trim().replace(/\s/g, '-').replace(/\//g, '-').replace(/[^a-zA-Z0-9\- _]/g, '').toLowerCase();
};

marked.setOptions({
  gfm: true,
  tables: true,
  breaks: true,
  smartLists: true,
  pedantic: false,
  sanitize: false, // To be able to add iframes
  highlight: function (code, lang) {
    var language = Nsh.getLanguage(lang || 'text');
    return Nsh.highlight(code, language || Nsh.getLanguage('text'));
  }
});

function evalTags(text, subdir) {
  var tagmap = {};

  // Yields the content with the rendered [[bracket tags]]
  // The rules are the same for Gollum https://github.com/github/gollum
  var matches = text.match(/(.?)\[\[(.+?)\]\]([^\[]?)/g);
  if (matches) {
    matches.forEach(function (match) {
      var id;
      var tag = /(.?)\[\[(.+?)\]\](.?)/.exec(match.trim());
      if (tag[1] === '\'') {
        return;
      }
      id = Crypto.createHash('sha1').update(tag[2]).digest('hex');
      tagmap[id] = tag[2];
      text = text.replace(tag[0], id);
    });
  }
  _.forIn(tagmap, function (value, key) {
    var parts, name, pageName;
    parts = value.split('|');
    name = pageName = parts[0];
    if (parts[1]) {
      pageName = parts[1];
    }

    tagmap[key] = '<a class="internal" href="/wiki/' + (subdir || 'alle') + '/' + normalize(pageName.toLowerCase()) + '">' + name + '</a>';
    text = text.replace(new RegExp(key, 'g'), tagmap[key]);
  });

  return text;
}

var Renderer = {
  render: function (content, subdir) {
    if (content === undefined || content === null) { return ''; }
    var rendered = marked(evalTags(content, subdir));
    return rendered.replace(/<table>/g, '<table class="table table-condensed table-hover table-striped">').replace(/<img src=/g, '<img class="img-responsive" src=');
  },
  normalize: normalize,
  firstTokentextOf: function (content, subdir) {
    var tokens = marked.lexer(evalTags(content, subdir));
    return tokens[0] ? tokens[0].text : '';
  },
  secondTokentextOf: function (content, subdir) {
    var tokens = marked.lexer(evalTags(content, subdir));
    return tokens[1] ? tokens[1].text : undefined;
  },
  titleAndRenderedTail: function (content, subdir) {
    var tokens = marked.lexer(evalTags(content, subdir));
    if (tokens.length === 0) {
      return {title: '', body: ''};
    }
    var title = tokens.shift();
    var rendered = marked.parser(tokens);
    return {
      title: title.text,
      body: rendered.replace(/<table>/g, '<table class="table table-condensed table-hover table-striped">').replace(/<img src=/g, '<img class="img-responsive" src=')
    };
  }
};

module.exports = Renderer;
