module.exports = function (grunt) {
  'use strict';

  // set up common objects for jslint
  var jsLintStandardOptions = {edition: 'latest', errorsOnly: true, failOnError: true};

  var serverDirectives = function () {
    return {indent: 2, node: true, nomen: true, todo: true, unparam: true, vars: true};
  };
  var jsLintServerDirectives = serverDirectives();
  var jsLintServerTestDirectives = serverDirectives();
  jsLintServerTestDirectives.ass = true;
  jsLintServerTestDirectives.predef = ['afterEach', 'after', 'beforeEach', 'before', 'describe', 'it'];

  // filesets for uglify
  var files = {
    'socrates/public/clientscripts/global.js': [
      'bower_components/jquery/dist/jquery.js',
      'bower_components/autoNumeric/autoNumeric.js',
      'bower_components/bootstrap/dist/js/bootstrap.js',
      'bower_components/bootstrap-datepicker/js/bootstrap-datepicker.js',
      'bower_components/bootstrap-markdown/js/bootstrap-markdown.js',
      'node_modules/moment-timezone/node_modules/moment/moment.js',
      'bower_components/smartmenus/dist/jquery.smartmenus.js',
      'socrates/build/javascript/jquery.smartmenus.bootstrap-patched.js',
      'bower_components/jquery-validation/dist/jquery.validate.js',
      'bower_components/jquery-validation/dist/additional-methods.js',
      'bower_components/bootstrap-timepicker/js/bootstrap-timepicker.js',
      'bower_components/URIjs/src/URI.js',
      'socrates/locales/frontend_en.js',
      'socrates/frontend/javascript/socrates.js'
    ]
  };

  grunt.initConfig({
    clean: {
      bower_components: ['bower_components'],
      build: ['socrates/build/'],
      public: ['socrates/public/clientscripts', 'socrates/public/fonts', 'socrates/public/stylesheets'],
      options: {force: true}
    },
    copy: {
      datatablesJS: {
        src: 'bower_components/datatables/media/js/*.min.js',
        dest: 'socrates/public/clientscripts',
        expand: true,
        flatten: true
      },
      datatablesBootstrapAndGermanJS: {
        src: 'softwerkskammer/frontend/3rd_party_js/dataTables*',
        dest: 'socrates/public/clientscripts',
        expand: true,
        flatten: true
      },
      bootstrapFONTS: {
        src: 'bower_components/bootstrap/dist/fonts/*',
        dest: 'socrates/public/fonts',
        expand: true,
        flatten: true
      },
      bootstrapLESS: {
        cwd: 'bower_components/bootstrap/less/',
        src: ['**', '!variables.less'],
        dest: 'socrates/build/stylesheets/less',
        expand: true,
        flatten: false
      },
      bootstrapMarkdownLESS: {
        src: 'bower_components/bootstrap-markdown/less/*',
        dest: 'socrates/build/stylesheets/less',
        expand: true,
        flatten: true
      },
      fontawesomeFONTS: {
        src: 'bower_components/font-awesome/fonts/*',
        dest: 'socrates/public/fonts',
        expand: true,
        flatten: true
      },
      customLESS: {
        src: ['socrates/frontend/less/*', 'softwerkskammer/frontend/less/bootstrap-markdown-patched.less'],
        dest: 'socrates/build/stylesheets/less',
        expand: true,
        flatten: true
      },
      customJS: {
        src: ['socrates/frontend/javascript/check-*',
          'socrates/frontend/javascript/enhance-*',
          'softwerkskammer/frontend/javascript/check-member*',
          'softwerkskammer/frontend/javascript/check-payment*',
          'softwerkskammer/frontend/javascript/activityDateModel.js',
          'softwerkskammer/frontend/javascript/activityform-dateAdapter.js'],
        dest: 'socrates/public/clientscripts',
        expand: true,
        flatten: true
      }
    },
    patch: {
      smartmenus: {
        options: {
          patch: 'softwerkskammer/frontend/3rd_party_js/jquery.smartmenus.bootstrap.js.patch'
        },
        files: {
          'socrates/build/javascript/jquery.smartmenus.bootstrap-patched.js': 'bower_components/smartmenus/dist/addons/bootstrap/jquery.smartmenus.bootstrap.js'
        }
      }
    },
    jslint: {
      server: {
        src: [
          'socrates/*.js',
          'socrates/lib/**/*.js'
        ],
        directives: jsLintServerDirectives,
        options: jsLintStandardOptions
      },
      servertests: {
        src: [
          'socrates/test/**/*.js',
          'socrates/testutil/**/*.js'
        ],
        directives: jsLintServerTestDirectives,
        options: jsLintStandardOptions
      },
      client: {
        src: [
          'socrates/frontend/javascript/*.js'
        ],
        directives: {
          indent: 2,
          browser: true,
          vars: true,
          predef: ['$']
        },
        options: jsLintStandardOptions
      }
    },
    karma: {
      options: {
        configFile: 'karma-socrates.conf.js'
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
          'socrates/public/stylesheets/screen.css': [
            'socrates/build/stylesheets/less/bootstrap.less',
            'bower_components/font-awesome/css/font-awesome.css',
            'node_modules/node-syntaxhighlighter/lib/styles/shCoreDefault.css',
            'bower_components/smartmenus/dist/addons/bootstrap/jquery.smartmenus.bootstrap.css',
            'socrates/build/stylesheets/less/bootstrap-markdown-patched.less',
            'socrates/build/stylesheets/less/socrates.less'
          ]
        }
      }
    },
    uglify: {
      development: {
        options: {
          mangle: false,
          beautify: true
        },
        files: files
      },
      production: {
        files: files
      }
    },

    mocha_istanbul: {
      test: {
        src: 'socrates/test',
        options: {
          coverageFolder: 'socrates/coverage',
          timeout: 6000,
          slow: 100,
          mask: '**/*.js',
          root: 'socrates/lib',
          reporter: 'dot',
          check: {
            lines: 72,
            statements: 68
          }
        }
      }
    },
    istanbul_check_coverage: {
      server: {
        options: {
          coverageFolder: 'socrates/coverage*',
          check: {
            lines: 72,
            statements: 68
          }
        }
      },
      frontend: {
        options: {
          coverageFolder: 'socrates/karma-coverage',
          check: {
            lines: 90,
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
            return require('./socrates/frontendtests/fixtures/locals');
          }
        },
        files: {
          'socrates/frontendtests/fixtures/forms.html': 'socrates/frontendtests/fixtures/forms.jade'
        }
      }
    },
    'bower-install-simple': {
      default: {
        options: {
          directory: 'bower_components'
        }
      }
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
  grunt.loadNpmTasks('grunt-patch');

  grunt.registerTask('prepare', ['jslint', 'bower-install-simple', 'copy', 'patch', 'less']);
  grunt.registerTask('frontendtests', ['clean', 'prepare', 'jade', 'uglify:production', 'karma:once', 'uglify:development', 'karma:once', 'istanbul_check_coverage:frontend']);
  grunt.registerTask('tests', ['prepare', 'frontendtests', 'mocha_istanbul', 'istanbul_check_coverage:server']);
  grunt.registerTask('deploy_development', ['prepare', 'uglify:development']);
  grunt.registerTask('deploy_production', ['clean', 'prepare', 'uglify:production']);

  // Default task.
  grunt.registerTask('default', ['tests', 'uglify:development']);
};
