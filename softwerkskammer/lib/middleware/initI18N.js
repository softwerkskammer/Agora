"use strict";
const i18n = require("i18next");
const middleware = require("i18next-http-middleware");
const Backend = require("i18next-fs-backend");
const intervalPlural = require("i18next-intervalplural-postprocessor");
const pug = require("pug");

const langs = ["de", "en"];

const pugPostProcessor = {
  name: "pug",
  type: "postProcessor",
  process: (val, key, opts) => pug.compile(val, opts)(),
};
i18n
  .use(Backend)
  .use(middleware.LanguageDetector)
  .use(pugPostProcessor)
  .use(intervalPlural)
  .init({
    compatibilityJSON: "v3",
    debug: false,
    supportedLngs: langs,
    preload: langs,
    fallbackLng: langs[0],
    returnObjects: true,
    joinArrays: "\n",
    backend: {
      loadPath: "../locales/{{ns}}-{{lng}}.json",
    },
    detection: {
      order: ["session"],
      lookupSession: "language",
    },
    interpolation: {
      skipOnVariables: false,
    },
  });
module.exports = middleware.handle(i18n, {});
