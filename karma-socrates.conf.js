module.exports = function (config) {
  'use strict';
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    frameworks: [ 'mocha', 'must', 'sinon' ],

    // list of files / patterns to load in the browser
    files: [
      'socrates/public/clientscripts/global.js',
      'socrates/public/clientscripts/activityDateModel.js',
      'socrates/public/clientscripts/activityform-dateAdapter.js',
      'socrates/frontendtests/fixtures/forms.html',
      'socrates/frontendtests/fixtures/fixtures.js',
      'socrates/public/clientscripts/check-memberform.js',
      'socrates/public/clientscripts/check-socrates-memberform.js',
      'socrates/public/clientscripts/check-activityform.js',
      'socrates/public/clientscripts/enhance-participationinfoform.js',
      'socrates/frontendtests/*.js'
    ],

    // list of files to exclude
    exclude: [
    ],

    // possible values: 'dots', 'progress'
    reporters: ['dots', 'coverage'],

    // web server port
    // CLI --port 9876
    port: 9877,

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
    browsers: ['PhantomJS'],

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
      'socrates/public/clientscripts/ac*.js': ['coverage'],
      'socrates/public/clientscripts/ch*.js': ['coverage'],
      '**/*.html': ['html2js']
    },

    coverageReporter: {
      type: 'json',
      dir: 'socrates/karma-coverage/',
      subdir: '.'
    },

    plugins: [
      'karma-coverage',
      'karma-html2js-preprocessor',
      'karma-mocha',
      'karma-must',
      'karma-phantomjs-launcher',
      'karma-sinon'
    ]
  });
};
