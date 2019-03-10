'use strict';
const puppeteer = require('puppeteer');
process.env.CHROME_BIN = puppeteer.executablePath();

module.exports = function (config) {
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    frameworks: ['mocha', 'must', 'sinon', 'intl-shim'],

    // list of files / patterns to load in the browser
    files: [
      'node_modules/intl/locale-data/jsonp/de.js',
      'softwerkskammer/public/clientscripts/global_de.js',
      'softwerkskammer/public/clientscripts/bootstrap-colorpicker.min.js',
      'softwerkskammer/public/clientscripts/bootstrap-datepicker.min.js',
      'softwerkskammer/public/clientscripts/simple-timepicker.min.js',
      'softwerkskammer/public/clientscripts/activityDateModel.js',
      'softwerkskammer/public/clientscripts/activityform-dateAdapter.js',
      'softwerkskammer/frontendtests/fixtures/forms.html',
      'softwerkskammer/frontendtests/fixtures/fixtures.js',
      'softwerkskammer/public/clientscripts/check-*.js',
      'softwerkskammer/frontendtests/*.js'
    ],

    // list of files to exclude
    exclude: [],

    // possible values: 'dots', 'progress'
    reporters: ['dots', 'coverage'],

    // web server port
    // CLI --port 9876
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    // CLI --colors --no-colors
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    // CLI --log-level debug
    logLevel: config.LOG_ERROR,

    // enable / disable watching file and executing tests whenever any file changes
    // CLI --auto-watch --no-auto-watch
    autoWatch: true,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    // CLI --browsers Chrome,Firefox,Safari
    browsers: ['ChromeHeadless'],

    // If browser does not capture in given timeout [ms], kill it
    // CLI --capture-timeout 5000
    captureTimeout: 20000,

    // Auto run tests on start (when browsers are captured) and exit
    // CLI --single-run --no-single-run
    singleRun: false,

    // report which specs are slower than 500ms
    // CLI --report-slower-than 500
    reportSlowerThan: 500,

    preprocessors: {
      // source files, that you wanna generate coverage for
      // do not include tests or libraries
      // (these files will be instrumented by Istanbul)
      'softwerkskammer/public/clientscripts/ac*.js': ['coverage'],
      'softwerkskammer/public/clientscripts/ch*.js': ['coverage'],
      '**/*.html': ['html2js']
    },

    coverageReporter: {
      reporters: [{type: 'json'}, {type: 'html'}],
      dir: 'softwerkskammer/karma-coverage/',
      subdir: '.'
    },

    plugins: [
      'karma-coverage',
      'karma-chrome-launcher',
      'karma-html2js-preprocessor',
      'karma-mocha',
      'karma-must',
      'karma-sinon',
      'karma-intl-shim'
    ]
  });
};
