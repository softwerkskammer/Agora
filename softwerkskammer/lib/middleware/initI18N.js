'use strict';

var i18n = require('i18next');
var middleware = require('i18next-express-middleware');
var Backend = require('i18next-node-fs-backend');
var intervalPlural = require('i18next-intervalplural-postprocessor');
var jade = require('jade');

module.exports = function initI18N(languages) {
  var JadePostProcessor = {
    name: 'jade',
    type: 'postProcessor',
    process: function (val, key, opts) {
      return jade.compile(val, opts)();
    }
  };
  var langs = languages.split(',');
  i18n
    .use(Backend)
    .use(middleware.LanguageDetector)
    .use(JadePostProcessor)
    .use(intervalPlural)
    .init({
      debug: false,
      supportedLngs: langs,
      preload: langs,
      fallbackLng: langs[0],
      returnObjects: true,
      joinArrays: '\n',
      backend: {
        loadPath: '../locales/{{ns}}-{{lng}}.json'
      },
      detection: {
        order: ['session'],
        lookupSession: 'language'
      }
    });
  return middleware.handle(i18n, {});
};


