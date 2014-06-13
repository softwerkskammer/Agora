module.exports = function (grunt) {
  // See http://www.jshint.com/docs/#strict
  'use strict';

  // set up common objects for jslint
  var jsLintStandardOptions = { edition: 'latest', errorsOnly: true, failOnError: true };

  var serverDirectives = function () {
    return { indent: 2, node: true, nomen: true, todo: true, unparam: true, vars: true };
  };
  var jsLintServerDirectives = serverDirectives();
  var jsLintServerTestDirectives = serverDirectives();
  jsLintServerTestDirectives.ass = true;
  jsLintServerTestDirectives.predef = ['afterEach', 'after', 'beforeEach', 'before', 'describe', 'it'];

  // filesets for uglify
  var files_de = {
    'public/clientscripts/global_de.js': [
      'locales/frontend_de.js',
      'node_modules/jquery/dist/jquery.js',
      'public/clientscripts/global/autoNumeric.js',
      'public/clientscripts/global/bootstrap.js',
      'public/clientscripts/global/bootstrap-datepicker.js',
      'public/clientscripts/global/bootstrap-markdown.js',
      'node_modules/moment-timezone/node_modules/moment/moment.js',
      'public/clientscripts/global/fullcalendar-patched.js',
      'public/clientscripts/global/de.js', // for fullcalendar
      'public/clientscripts/global/tinycolor.js', // for pick-a-color
      'public/clientscripts/global/pick-a-color.js',
      'public/clientscripts/global/bootstrap-datepicker.de.js',
      'node_modules/jquery-validation/jquery.validate.js',
      'node_modules/jquery-validation/additional-methods.js',
      'node_modules/jquery-validation/localization/messages_de.js',
      'node_modules/jquery-validation/localization/methods_de.js',
      'node_modules/bootstrap-timepicker/js/bootstrap-timepicker.js',
      'node_modules/URIjs/src/URI.js',
      'public/clientscripts/global/agora.js'
    ]
  };

  var files_en = {
    'public/clientscripts/global_en.js': [
      'locales/frontend_en.js',
      'node_modules/jquery/dist/jquery.js',
      'public/clientscripts/global/autoNumeric.js',
      'public/clientscripts/global/bootstrap.js',
      'public/clientscripts/global/bootstrap-datepicker.js',
      'public/clientscripts/global/bootstrap-markdown.js',
      'node_modules/moment-timezone/node_modules/moment.js',
      'public/clientscripts/global/fullcalendar-patched.js',
      'public/clientscripts/global/en-gb.js', // for fullcalendar
      'public/clientscripts/global/tinycolor.min.js', // for pick-a-color
      'public/clientscripts/global/pick-a-color.js',
      'node_modules/jquery-validation/jquery.validate.js',
      'node_modules/jquery-validation/additional-methods.js',
      'node_modules/bootstrap-timepicker/js/bootstrap-timepicker.js',
      'node_modules/URIjs/src/URI.js',
      'public/clientscripts/global/agora.js'
    ]
  };

  // Project configuration.
  grunt.initConfig({
    // Task configuration.
    clean: ['coverage', 'frontendtests/fixtures/*.html'],
    jslint: {
      server: {
        src: [
          '*.js',
          'lib/**/*.js'
        ],
        directives: jsLintServerDirectives,
        options: jsLintStandardOptions
      },
      servertests: {
        src: [
          'test/**/*.js',
          'testWithDB/**/*.js',
          'testutil/**/*.js',
          'frontendtests/fixtures/locals.js'
        ],
        directives: jsLintServerTestDirectives,
        options: jsLintStandardOptions
      },
      client: {
        src: [
          'public/clientscripts/global/agora.js',
          'public/clientscripts/check-*.js',
          'public/clientscripts/activity*.js'
        ],
        directives: {
          indent: 2,
          browser: true,
          vars: true,
          predef: ['$']
        },
        options: jsLintStandardOptions
      },
      clienttests: {
        src: [
          'frontendtests/*.js',
          'frontendtests/fixtures/fixtures.js'
        ],
        directives: {
          indent: 2,
          browser: true,
          vars: true,
          nomen: true,
          predef: ['$', 'describe', 'expect', 'beforeEach', 'afterEach', 'jasmine', 'it']
        },
        options: jsLintStandardOptions
      }
    },
    karma: {
      options: {
        configFile: 'karma.conf.js'
      },
      once: {
        browsers: ['PhantomJS'],
        runnerPort: 6666,
        singleRun: true
      },
      continuous: {
        browsers: ['Chrome'],
        autoWatch: true
      }
    },
    less: {
      minify: {
        options: {
          cleancss: true,
          report: 'min'
        },
        files: {
          'public/stylesheets/screen.css': [
            'public/stylesheets/vendor/fullcalendar.css',
            'public/stylesheets/less/bootstrap.less',
            'public/stylesheets/vendor/datepicker3.css',
            'public/stylesheets/less/bootstrap-markdown-patched.less',
            'public/stylesheets/vendor/font-awesome.min.css',
            'public/stylesheets/less/pick-a-color-patched.less',
            'public/stylesheets/vendor/shCoreDefault-patched.css',
            'public/stylesheets/vendor/jquery.dataTables.css',
            'public/stylesheets/partials/agora.less'
          ]
        }
      }
    },
    uglify: {
      development_de: {
        options: {
          mangle: false,
          beautify: true
        },
        files: files_de
      },
      development_en: {
        options: { beautify: true },
        files: files_en
      },
      production_de: {
        files: files_de
      },
      production_en: {
        files: files_en
      }
    },

    mocha_istanbul: {
      testWithDB: {
        src: 'testWithDB', // the folder, not the files,
        options: {
          root: 'testWithDB', // to make istanbul _not instrument_ our production code
          mask: '**/*.js',
          reporter: 'dot' // set to 'spec' if you like it more verbose
        }
      },
      test: {
        src: 'test', // the folder, not the files,
        options: {
          root: 'lib',
          mask: '**/*.js',
          reporter: 'dot', // set to 'spec' if you like it more verbose
          check: {
            lines: 80,
            statements: 76
          }
        }
      }
    },
    jade: {
      compile: {
        options: {
          pretty: true,
          data: function () {
            return require('./frontendtests/fixtures/locals');
          }
        },
        files: {
          "frontendtests/fixtures/forms.html": "frontendtests/fixtures/forms.jade"
        }
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-mocha-istanbul');
  grunt.loadNpmTasks('grunt-jslint');
  grunt.loadNpmTasks('grunt-karma');

  grunt.registerTask('frontendtests', ['clean', 'jade', 'uglify:production_de', 'karma:once', 'uglify:development_de', 'karma:once']);
  grunt.registerTask('tests', ['jslint', 'frontendtests', 'mocha_istanbul']);
  grunt.registerTask('deploy_development', ['less', 'uglify:development_de', 'uglify:development_en']);

  // Default task.
  grunt.registerTask('default', ['tests', 'deploy_development']);

  // Travis-CI task
  grunt.registerTask('travis', ['default']);

  grunt.registerTask('deploy_production', ['less', 'uglify:production_de', 'uglify:production_en']);
};
