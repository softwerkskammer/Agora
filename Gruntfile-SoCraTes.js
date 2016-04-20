module.exports = function (grunt) {
  /*eslint camelcase: 0*/
  'use strict';

  // filesets for uglify
  var files = {
    'socrates/public/clientscripts/global.js': [
      'node_modules/jquery/dist/jquery.js',
      'node_modules/guillotine/js/jquery.guillotine.js',
      'node_modules/select2/dist/js/select2.js',
      'node_modules/autonumeric/autonumeric.js',
      'node_modules/bootstrap/dist/js/bootstrap.js',
      'node_modules/bootstrap-datepicker/js/bootstrap-datepicker.js',
      'node_modules/bootstrap-markdown/js/bootstrap-markdown.js',
      'node_modules/moment/moment.js',
      'node_modules/drmonty-smartmenus/js/jquery.smartmenus.js',
      'socrates/build/javascript/jquery.smartmenus.bootstrap-patched.js',
      'node_modules/jquery-validation/dist/jquery.validate.js',
      'node_modules/jquery-validation/dist/additional-methods.js',
      'node_modules/simple-timepicker/dist/simple-timepicker.js',
      'node_modules/urijs/src/URI.js',
      'locales/frontend_en.js',
      'socrates/frontend/javascript/socrates.js'
    ]
  };

  grunt.initConfig({
    clean: {
      build: ['socrates/build/'],
      public: ['socrates/public/clientscripts', 'socrates/public/fonts', 'socrates/public/stylesheets'],
      options: {force: true}
    },
    copy: {
      datatablesJS: {
        src: 'node_modules/datatables/media/js/*.min.js',
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
      datatablesImages: {
        src: 'node_modules/datatables/media/images/*',
        dest: 'socrates/public/images/',
        expand: true,
        flatten: true
      },
      bootstrapFONTS: {
        src: 'node_modules/bootstrap/dist/fonts/*',
        dest: 'socrates/public/fonts',
        expand: true,
        flatten: true
      },
      bootstrapLESS: {
        cwd: 'node_modules/bootstrap/less/',
        src: ['**', '!variables.less'],
        dest: 'socrates/build/stylesheets/less',
        expand: true,
        flatten: false
      },
      bootstrapCustomVariablesLESS: {
        src: 'node_modules/bootstrap/less/variables.less',
        dest: 'socrates/build/stylesheets/less/original-variables.less'
      },
      bootstrapMarkdownLESS: {
        src: 'node_modules/bootstrap-markdown/less/*',
        dest: 'socrates/build/stylesheets/less',
        expand: true,
        flatten: true
      },
      fontawesomeFONTS: {
        src: 'node_modules/font-awesome/fonts/*',
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
          'socrates/build/javascript/jquery.smartmenus.bootstrap-patched.js': 'node_modules/drmonty-smartmenus/js/jquery.smartmenus.bootstrap.js'
        }
      }
    },
    eslint: {
      options: {quiet: true},
      target: ['socrates/**/*.js']
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
            'node_modules/font-awesome/css/font-awesome.css',
            'node_modules/node-syntaxhighlighter/lib/styles/shCoreDefault.css',
            'node_modules/drmonty-smartmenus/css/jquery.smartmenus.bootstrap.css',
            'socrates/build/stylesheets/less/bootstrap-markdown-patched.less',
            'node_modules/datatables/media/css/jquery.dataTables.css',
            'softwerkskammer/frontend/3rd_party_css/dataTables.bootstrap.css',
            'node_modules/select2/dist/css/select2.css',
            'node_modules/select2-bootstrap-css/select2-bootstrap.css',
            'softwerkskammer/frontend/3rd_party_css/dataTables.fontAwesome.css',
            'node_modules/guillotine/css/jquery.guillotine.css',
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
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-mocha-istanbul');
  grunt.loadNpmTasks('grunt-patch');

  grunt.registerTask('prepare', ['eslint', 'copy', 'patch', 'less']);
  grunt.registerTask('frontendtests', ['clean', 'prepare', 'jade', 'uglify:production', 'karma:once', 'uglify:development', 'karma:once', 'istanbul_check_coverage:frontend']);
  grunt.registerTask('tests', ['prepare', 'frontendtests', 'mocha_istanbul', 'istanbul_check_coverage:server']);
  grunt.registerTask('deploy_development', ['prepare', 'uglify:development']);
  grunt.registerTask('deploy_production', ['clean', 'prepare', 'uglify:production']);

  // Default task.
  grunt.registerTask('default', ['tests', 'uglify:development']);
};
