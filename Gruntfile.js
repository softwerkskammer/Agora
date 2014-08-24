module.exports = function (grunt) {
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
      'bower_components/jquery/dist/jquery.js',
      'bower_components/select2/select2.js',
      'bower_components/select2/select2_locale_de.js',
      'bower_components/autoNumeric/autoNumeric.js',
      'bower_components/bootstrap/dist/js/bootstrap.js',
      'bower_components/bootstrap-datepicker/js/bootstrap-datepicker.js',
      'bower_components/bootstrap-markdown/js/bootstrap-markdown.js',
      'node_modules/moment-timezone/node_modules/moment/moment.js',
      'frontend/3rd_party_js/jquery.smartmenus.js',
      'frontend/3rd_party_js/jquery.smartmenus.bootstrap.js',
      'frontend/3rd_party_js/fullcalendar-patched.js',
      'bower_components/fullcalendar/dist/lang/de.js', // for fullcalendar
      'bower_components/tinycolor/tinycolor.js', // for pick-a-color
      'bower_components/pick-a-color/src/js/pick-a-color.js',
      'bower_components/bootstrap-datepicker/js/locales/bootstrap-datepicker.de.js',
      'bower_components/jquery-validation/dist/jquery.validate.js',
      'bower_components/jquery-validation/dist/additional-methods.js',
      'bower_components/jquery-validation/src/localization/messages_de.js',
      'bower_components/jquery-validation/src/localization/methods_de.js',
      'bower_components/jquery.qrcode/dist/jquery.qrcode.js',
      'bower_components/bootstrap-timepicker/js/bootstrap-timepicker.js',
      'bower_components/jqcloud2/dist/jqcloud.js',
      'bower_components/tinygradient/tinygradient.js',
      'node_modules/URIjs/src/URI.js',
      'frontend/javascript/agora.js'
    ]
  };

  var files_en = {
    'public/clientscripts/global_en.js': [
      'locales/frontend_en.js',
      'bower_components/jquery/dist/jquery.js',
      'bower_components/select2/select2.js',
      'bower_components/autoNumeric/autoNumeric.js',
      'bower_components/bootstrap/dist/js/bootstrap.js',
      'bower_components/bootstrap-datepicker/js/bootstrap-datepicker.js',
      'bower_components/bootstrap-markdown/js/bootstrap-markdown.js',
      'node_modules/moment-timezone/node_modules/moment/moment.js',
      'frontend/3rd_party_js/jquery.smartmenus.js',
      'frontend/3rd_party_js/jquery.smartmenus.bootstrap.js',
      'frontend/3rd_party_js/fullcalendar-patched.js',
      'bower_components/fullcalendar/dist/lang/en-gb.js', // for fullcalendar
      'bower_components/tinycolor/tinycolor.js', // for pick-a-color
      'bower_components/pick-a-color/src/js/pick-a-color.js',
      'bower_components/jquery-validation/dist/jquery.validate.js',
      'bower_components/jquery-validation/dist/additional-methods.js',
      'bower_components/jquery.qrcode/dist/jquery.qrcode.js',
      'bower_components/bootstrap-timepicker/js/bootstrap-timepicker.js',
      'bower_components/jqcloud2/dist/jqcloud.js',
      'bower_components/tinygradient/tinygradient.js',
      'node_modules/URIjs/src/URI.js',
      'frontend/javascript/agora.js'
    ]
  };

  grunt.initConfig({
    clean: ['coverage', 'coverageWithDB', 'karma-coverage', 'frontendtests/fixtures/*.html'],
    copy: {
      datatablesJS: {
        src: 'bower_components/datatables/media/js/*.min.js',
        dest: 'public/clientscripts',
        expand: true,
        flatten: true
      },
      datatablesImages: {
        src: 'bower_components/datatables/media/images/*',
        dest: 'public/images/',
        expand: true,
        flatten: true
      },
      bootstrapFONTS: {
        src: 'bower_components/bootstrap/dist/fonts/*',
        dest: 'public/fonts',
        expand: true,
        flatten: true
      },
      bootstrapLESS: {
        cwd: 'bower_components/bootstrap/less/',
        src: ['**', '!variables.less'],
        dest: 'build/stylesheets/less',
        expand: true,
        flatten: false
      },
      fontawesomeFONTS: {
        src: 'bower_components/font-awesome/fonts/*',
        dest: 'public/fonts',
        expand: true,
        flatten: true
      },
      customJS: {
        cwd: 'frontend/javascript/',
        src: ['*', '!agora.js'],
        dest: 'public/clientscripts',
        expand: true,
        flatten: false
      },
      patchedJS: {
        src: 'frontend/3rd_party_js/dataTables*',
        dest: 'public/clientscripts',
        expand: true,
        flatten: true
      },
      customLESS: {
        src: 'frontend/less/*',
        dest: 'build/stylesheets/less',
        expand: true,
        flatten: true
      },
      select2images: {
        cwd: 'bower_components/select2/',
        src: ['*.png', '*.gif'],
        dest: 'public/stylesheets',
        expand: true,
        flatten: false
      }
    },
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
          'frontend/javascript/*.js'
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
          predef: ['$', 'describe', 'expect', 'beforeEach', 'afterEach', 'sinon', 'it', 'testglobals']
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
            'bower_components/fullcalendar/dist/fullcalendar.css',
            'build/stylesheets/less/bootstrap.less',
            'bower_components/bootstrap-datepicker/css/datepicker3.css',
            'build/stylesheets/less/bootstrap-markdown-patched.less',
            'bower_components/font-awesome/css/font-awesome.css',
            'build/stylesheets/less/pick-a-color-patched.less',
            'frontend/3rd_party_css/shCoreDefault-patched.css',
            'frontend/3rd_party_css/jquery.smartmenus.bootstrap.css',
            'bower_components/datatables/media/css/jquery.dataTables.css',
            'frontend/3rd_party_css/dataTables.bootstrap.css',
            'frontend/3rd_party_css/dataTables.fontAwesome.css',
            'bower_components/select2/select2.css',
            'bower_components/select2-bootstrap-css/select2-bootstrap.css',
            'build/stylesheets/less/agora.less',
            'build/stylesheets/less/activityresults.less'
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
        src: 'testWithDB',
        options: {
          coverageFolder: 'coverageWithDB',
          excludes: ['**/activitystore.js'],
          timeout: 6000,
          slow: 100,
          mask: '**/*.js',
          root: 'lib',
          reporter: 'dot'
        }
      },
      test: {
        src: 'test',
        options: {
          timeout: 6000,
          slow: 100,
          mask: '**/*.js',
          root: 'lib',
          reporter: 'dot',
          check: {
            lines: 80,
            statements: 76
          }
        }
      }
    },
    istanbul_check_coverage: {
      server: {
        options: {
          coverageFolder: 'coverage*',
          check: {
            lines: 81,
            statements: 77
          }
        }
      },
      frontend: {
        options: {
          coverageFolder: 'karmacoverage',
          check: {
            lines: 94,
            statements: 94
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
          'frontendtests/fixtures/forms.html': 'frontendtests/fixtures/forms.jade'
        }
      }
    },
    'bower-install-simple': {
      default: {}
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-bower-install-simple');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-mocha-istanbul');
  grunt.loadNpmTasks('grunt-jslint');
  grunt.loadNpmTasks('grunt-karma');

  grunt.registerTask('prepare', ['bower-install-simple', 'copy', 'less']);
  grunt.registerTask('frontendtests', ['prepare', 'clean', 'jade', 'uglify:production_de', 'karma:once', 'uglify:development_de', 'karma:once', 'istanbul_check_coverage:frontend']);
  grunt.registerTask('tests', ['jslint', 'frontendtests', 'mocha_istanbul', 'istanbul_check_coverage:server']);
  grunt.registerTask('deploy_development', ['prepare', 'uglify:development_de', 'uglify:development_en']);

  // Default task.
  grunt.registerTask('default', ['tests', 'uglify:development_en']);

  // Travis-CI task
  grunt.registerTask('travis', ['default']);

  grunt.registerTask('deploy_production', ['prepare', 'uglify:production_de', 'uglify:production_en']);
};
