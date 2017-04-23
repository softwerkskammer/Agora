'use strict';
module.exports = function (grunt) {
  /*eslint camelcase: 0*/

  // filesets for uglify
  const files = {
    'socrates/public/clientscripts/global.js': [
      'node_modules/jquery/dist/jquery.js',
      'node_modules/guillotine/js/jquery.guillotine.js',
      'node_modules/select2/dist/js/select2.full.js',
      'node_modules/autonumeric/autonumeric.js',
      'node_modules/bootstrap/dist/js/bootstrap.js',
      'node_modules/bootstrap-datepicker/js/bootstrap-datepicker.js',
      'node_modules/bootstrap-markdown/js/bootstrap-markdown.js',
      'node_modules/moment/moment.js',
      'node_modules/moment-timezone/moment-timezone.js',
      'node_modules/drmonty-smartmenus/js/jquery.smartmenus.js',
      'socrates/build/javascript/jquery.smartmenus.bootstrap-patched.js',
      'node_modules/jquery-validation/dist/jquery.validate.js',
      'node_modules/jquery-validation/dist/additional-methods.js',
      'node_modules/simple-timepicker/dist/simple-timepicker.js',
      'node_modules/urijs/src/URI.js',
      'locales/frontend_en.js',
      'commonComponents/frontend-js/frontendutils.js',
      'socrates/frontend/javascript/socrates.js'
    ]
  };

  const filesForCss = {
    'socrates/public/stylesheets/screen.css': [
      'socrates/build/stylesheets/less/bootstrap.less',
      'node_modules/bootstrap-datepicker/dist/css/bootstrap-datepicker3.css',
      'node_modules/font-awesome/css/font-awesome.css',
      'node_modules/node-syntaxhighlighter/lib/styles/shCoreDefault.css',
      'node_modules/drmonty-smartmenus/css/jquery.smartmenus.bootstrap.css',
      'socrates/build/stylesheets/less/bootstrap-markdown-patched.less',
      'node_modules/datatables.net-bs/css/dataTables.bootstrap.css',
      'softwerkskammer/frontend/3rd_party_css/dataTables.fontAwesome.css',
      'node_modules/select2/dist/css/select2.css',
      'socrates/build/stylesheets/less/build-select2-bootstrap.less',
      'softwerkskammer/frontend/3rd_party_css/dataTables.fontAwesome.css',
      'node_modules/guillotine/css/jquery.guillotine.css',
      'socrates/build/stylesheets/less/socrates.less'
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
        src: 'node_modules/datatables.net/js/*.js',
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
        src: 'node_modules/datatables.net-dt/images/*',
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
      bootstrapSelect2LESS: {
        src: 'node_modules/select2-bootstrap-theme/src/select2-bootstrap.less',
        dest: 'socrates/build/stylesheets/less',
        expand: true,
        flatten: true
      },
      customLESS: {
        src: ['socrates/frontend/less/*', 'softwerkskammer/frontend/less/bootstrap-markdown-patched.less', 'softwerkskammer/frontend/less/build-select2-bootstrap.less'],
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
      development: {
        files: filesForCss
      },
      production: {
        options: {
          plugins: [
            new (require('less-plugin-clean-css'))()
          ],
          report: 'min'
        },
        files: filesForCss
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
    pug: {
      compile: {
        options: {
          pretty: true,
          data: function () {
            return require('./socrates/frontendtests/fixtures/locals');
          }
        },
        files: {
          'socrates/frontendtests/fixtures/forms.html': 'socrates/frontendtests/fixtures/forms.pug'
        }
      }
    },
    puglint: {
      standard: {
        options: {
          disallowAttributeInterpolation: true,
          disallowDuplicateAttributes: true,
          disallowIdAttributeWithStaticValue: true,
          disallowLegacyMixinCall: true,
          disallowSpaceAfterCodeOperator: true,
          disallowTemplateString: true,
          requireClassLiteralsBeforeAttributes: true,
          requireIdLiteralsBeforeAttributes: true,
          requireLowerCaseTags: true,
          requireStrictEqualityOperators: true,
          validateAttributeQuoteMarks: '\'',
          validateAttributeSeparator: ', '
        },
        src: ['socrates/**/*.pug']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-pug');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-mocha-istanbul');
  grunt.loadNpmTasks('grunt-patcher');
  grunt.loadNpmTasks('grunt-puglint');

  grunt.registerTask('prepare', ['clean', 'eslint', 'puglint', 'copy', 'patch']);
  grunt.registerTask('frontendtests', ['prepare', 'less:development', 'pug', 'uglify:production', 'karma:once', 'uglify:development', 'karma:once', 'istanbul_check_coverage:frontend']);
  grunt.registerTask('tests', ['frontendtests', 'mocha_istanbul', 'istanbul_check_coverage:server']);
  grunt.registerTask('deploy_development', ['prepare', 'less:development', 'uglify:development']);
  grunt.registerTask('deploy_production', ['prepare', 'less:production', 'uglify:production']);

  // Default task.
  grunt.registerTask('default', ['tests']);
};
