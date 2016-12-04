const marked = require('marked');
const Crypto = require('crypto');
const Nsh = require('node-syntaxhighlighter');
const iconv = require('iconv-lite');
const R = require('ramda');

function normalize(str) {
  if (typeof str !== 'string' || str.trim() === '') {
    return '';
  }
  // iconv-lite cannot do this yet, so we do it manually:
  const withoutUmlauts = str.replace(/[äÄàáÀÁâÂ]/gi, 'a')
    .replace(/[èéÈÉêÊ]/gi, 'e')
    .replace(/[ìíÌÍîÎ]/gi, 'i')
    .replace(/[öÖòóÒÓôÔ]/gi, 'o')
    .replace(/[üÜùúÙÚûÛ]/gi, 'u')
    .replace(/ß/g, 's');
  return iconv.decode(new Buffer(withoutUmlauts, 'utf-8'), 'utf8').trim().replace(/\s/g, '-').replace(/\//g, '-').replace(/[^a-zA-Z0-9\- _]/g, '').toLowerCase();
}

marked.setOptions({
                    gfm: true,
                    tables: true,
                    breaks: true,
                    smartLists: true,
                    pedantic: false,
                    sanitize: false, // To be able to add iframes
                    highlight: function (code, lang) {
                      const language = Nsh.getLanguage(lang || 'text');
                      return Nsh.highlight(code, language || Nsh.getLanguage('text'));
                    }
                  });

function evalTags(text, subdir) {
  let result = text;
  const tagmap = {};

  // Yields the content with the rendered [[bracket tags]]
  // The rules are the same for Gollum https://github.com/github/gollum
  const matches = result.match(/(.?)\[\[(.+?)\]\]([^\[]?)/g);
  if (matches) {
    for (let match of matches) {
      const tag = /(.?)\[\[(.+?)\]\](.?)/.exec(match.trim());
      if (tag[1] === '\'') {
        return;
      }
      const id = Crypto.createHash('sha1').update(tag[2]).digest('hex');
      tagmap[id] = tag[2];
      result = result.replace(tag[0], id);
    }
  }
  R.keys(tagmap).forEach(key => {
    const parts = tagmap[key].split('|');
    const name = parts[0];
    const pageName = parts[1] || name;

    tagmap[key] = '<a class="internal" href="/wiki/' + (subdir || 'alle') + '/' + normalize(pageName.toLowerCase()) + '">' + name + '</a>';
    result = result.replace(new RegExp(key, 'g'), tagmap[key]);
  });

  return result;
}

function enhanceTableTag(rendered) {
  return rendered.replace(/<table>/g, '<table class="table table-condensed table-hover table-striped">').replace(/<img src=/g, '<img class="img-responsive" src=');
}
module.exports = {
  render: function render(content, subdir) {
    if (content === undefined || content === null) { return ''; }
    const rendered = marked(evalTags(content, subdir));
    return enhanceTableTag(rendered);
  },
  normalize: normalize,
  firstTokentextOf: function firstTokentextOf(content, subdir) {
    const tokens = marked.lexer(evalTags(content, subdir));
    return tokens[0] ? tokens[0].text : '';
  },
  secondTokentextOf: function secondTokentextOf(content, subdir) {
    const tokens = marked.lexer(evalTags(content, subdir));
    return tokens[1] ? tokens[1].text : undefined;
  },
  titleAndRenderedTail: function titleAndRenderedTail(content, subdir) {
    const tokens = marked.lexer(evalTags(content, subdir));
    if (tokens.length === 0) {
      return {title: '', body: ''};
    }
    const title = tokens.shift();
    const rendered = marked.parser(tokens);
    return {
      title: title.text,
      body: enhanceTableTag(rendered)
    };
  }
};
