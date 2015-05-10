module.exports = function (grunt) {
  /*eslint camelcase: 0*/
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

  var commonJSfiles = [
    'bower_components/jquery/dist/jquery.js',
    'bower_components/jquery-guillotine/js/jquery.guillotine.js',
    'bower_components/select2/select2.js',
    'bower_components/autoNumeric/autoNumeric.js',
    'bower_components/bootstrap/dist/js/bootstrap.js',
    'bower_components/bootstrap-datepicker/js/bootstrap-datepicker.js',
    'bower_components/bootstrap-markdown/js/bootstrap-markdown.js',
    'bower_components/bootstrap-markdown/locale/bootstrap-markdown.de.js',
    'node_modules/moment-timezone/node_modules/moment/moment.js',
    'bower_components/smartmenus/dist/jquery.smartmenus.js',
    'softwerkskammer/build/javascript/jquery.smartmenus.bootstrap-patched.js',
    'softwerkskammer/build/javascript/fullcalendar-patched.js',
    'bower_components/tinycolor/tinycolor.js',
    'bower_components/mjolnic-bootstrap-colorpicker/dist/js/bootstrap-colorpicker.js',
    'bower_components/jquery-validation/dist/jquery.validate.js',
    'bower_components/jquery-validation/dist/additional-methods.js',
    'bower_components/jquery.qrcode/dist/jquery.qrcode.js',
    'bower_components/bootstrap-timepicker/js/bootstrap-timepicker.js',
    'bower_components/jqcloud2/dist/jqcloud.js',
    'bower_components/tinygradient/tinygradient.js',
    'bower_components/URIjs/src/URI.js'
  ];

  // filesets for uglify
  var files_de = {
    'softwerkskammer/public/clientscripts/global_de.js': commonJSfiles.concat([
      'bower_components/jquery-validation/src/localization/messages_de.js',
      'bower_components/jquery-validation/src/localization/methods_de.js',
      'bower_components/bootstrap-datepicker/js/locales/bootstrap-datepicker.de.js',
      'bower_components/select2/select2_locale_de.js',
      'bower_components/fullcalendar/dist/lang/de.js',
      'softwerkskammer/locales/frontend_de.js',
      'softwerkskammer/frontend/javascript/agora.js'
    ])
  };

  var files_en = {
    'softwerkskammer/public/clientscripts/global_en.js': commonJSfiles.concat([
      'bower_components/fullcalendar/dist/lang/en-gb.js',
      'softwerkskammer/locales/frontend_en.js',
      'softwerkskammer/frontend/javascript/agora.js'
    ])
  };

  grunt.initConfig({
    clean: {
      bower_components: ['bower_components'],
      build: ['softwerkskammer/build', 'softwerkskammer/frontendtests/fixtures/*.html'],
      coverage: ['softwerkskammer/coverage', 'softwerkskammer/coverageWithDB', 'softwerkskammer/karma-coverage'],
      public: ['softwerkskammer/public/clientscripts', 'softwerkskammer/public/fonts', 'softwerkskammer/public/img/bootstrap-colorpicker', 'softwerkskammer/public/images', 'softwerkskammer/public/stylesheets'],
      options: {force: true}
    },
    copy: {
      datatablesJS: {
        src: 'bower_components/datatables/media/js/*.min.js',
        dest: 'softwerkskammer/public/clientscripts',
        expand: true,
        flatten: true
      },
      datatablesBootstrapAndGermanJS: {
        src: 'softwerkskammer/frontend/3rd_party_js/dataTables*',
        dest: 'softwerkskammer/public/clientscripts',
        expand: true,
        flatten: true
      },
      datatablesImages: {
        src: 'bower_components/datatables/media/images/*',
        dest: 'softwerkskammer/public/images/',
        expand: true,
        flatten: true
      },
      colorpickerImages: {
        cwd: 'bower_components/mjolnic-bootstrap-colorpicker/dist/img',
        src: ['**'],
        dest: 'softwerkskammer/public/img/',
        expand: true,
        flatten: false
      },
      bootstrapFONTS: {
        src: 'bower_components/bootstrap/dist/fonts/*',
        dest: 'softwerkskammer/public/fonts',
        expand: true,
        flatten: true
      },
      bootstrapLESS: {
        cwd: 'bower_components/bootstrap/less/',
        src: ['**', '!variables.less'],
        dest: 'softwerkskammer/build/stylesheets/less',
        expand: true,
        flatten: false
      },
      bootstrapMarkdownLESS: {
        src: 'bower_components/bootstrap-markdown/less/*',
        dest: 'softwerkskammer/build/stylesheets/less',
        expand: true,
        flatten: true
      },
      fontawesomeFONTS: {
        src: 'bower_components/font-awesome/fonts/*',
        dest: 'softwerkskammer/public/fonts',
        expand: true,
        flatten: true
      },
      customJS: {
        cwd: 'softwerkskammer/frontend/javascript/',
        src: ['*', '!agora.js'],
        dest: 'softwerkskammer/public/clientscripts',
        expand: true,
        flatten: false
      },
      customLESS: {
        src: 'softwerkskammer/frontend/less/*',
        dest: 'softwerkskammer/build/stylesheets/less',
        expand: true,
        flatten: true
      },
      select2images: {
        cwd: 'bower_components/select2/',
        src: ['*.png', '*.gif'],
        dest: 'softwerkskammer/public/stylesheets',
        expand: true,
        flatten: false
      }
    },
    patch: {
      smartmenus: {
        options: {
          patch: 'softwerkskammer/frontend/3rd_party_js/jquery.smartmenus.bootstrap.js.patch'
        },
        files: {
          'softwerkskammer/build/javascript/jquery.smartmenus.bootstrap-patched.js': 'bower_components/smartmenus/dist/addons/bootstrap/jquery.smartmenus.bootstrap.js'
        }
      },
      fullcalendar: {
        options: {
          patch: 'softwerkskammer/frontend/3rd_party_js/fullcalendar.js.patch'
        },
        files: {
          'softwerkskammer/build/javascript/fullcalendar-patched.js': 'bower_components/fullcalendar/dist/fullcalendar.js'
        }
      }
    },
    jslint: {
      server: {
        src: [
          'softwerkskammer/*.js',
          'softwerkskammer/lib/**/*.js'
        ],
        directives: jsLintServerDirectives,
        options: jsLintStandardOptions
      },
      servertests: {
        src: [
          'softwerkskammer/test/**/*.js',
          'softwerkskammer/testWithDB/**/*.js',
          'softwerkskammer/testutil/**/*.js',
          'softwerkskammer/frontendtests/fixtures/locals.js'
        ],
        directives: jsLintServerTestDirectives,
        options: jsLintStandardOptions
      },
      client: {
        src: [
          'softwerkskammer/frontend/javascript/*.js'
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
          'softwerkskammer/frontendtests/*.js',
          'softwerkskammer/frontendtests/fixtures/fixtures.js'
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
          'softwerkskammer/public/stylesheets/screen.css': [
            'bower_components/fullcalendar/dist/fullcalendar.css',
            'softwerkskammer/build/stylesheets/less/bootstrap.less',
            'bower_components/bootstrap-datepicker/css/datepicker3.css',
            'softwerkskammer/build/stylesheets/less/bootstrap-markdown-patched.less',
            'bower_components/font-awesome/css/font-awesome.css',
            'node_modules/node-syntaxhighlighter/lib/styles/shCoreDefault.css',
            'bower_components/smartmenus/dist/addons/bootstrap/jquery.smartmenus.bootstrap.css',
            'bower_components/datatables/media/css/jquery.dataTables.css',
            'softwerkskammer/frontend/3rd_party_css/dataTables.bootstrap.css',
            'softwerkskammer/frontend/3rd_party_css/dataTables.fontAwesome.css',
            'bower_components/select2/select2.css',
            'bower_components/select2-bootstrap-css/select2-bootstrap.css',
            'bower_components/mjolnic-bootstrap-colorpicker/dist/css/bootstrap-colorpicker.css',
            'bower_components/jquery-guillotine/css/jquery.guillotine.css',
            'softwerkskammer/build/stylesheets/less/agora.less'
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
        options: {beautify: true},
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
        src: 'softwerkskammer/testWithDB',
        options: {
          coverageFolder: 'softwerkskammer/coverageWithDB',
          excludes: ['**/activitystore.js'],
          timeout: 6000,
          slow: 100,
          mask: '**/*.js',
          root: 'softwerkskammer/lib',
          reporter: 'dot'
        }
      },
      test: {
        src: 'softwerkskammer/test',
        options: {
          coverageFolder: 'softwerkskammer/coverage',
          timeout: 6000,
          slow: 100,
          mask: '**/*.js',
          root: 'softwerkskammer/lib',
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
          coverageFolder: 'softwerkskammer/coverage*',
          check: {
            lines: 81,
            statements: 77
          }
        }
      },
      frontend: {
        options: {
          coverageFolder: 'softwerkskammer/karma-coverage',
          check: {
            lines: 93,
            statements: 93
          }
        }
      }
    },
    jade: {
      compile: {
        options: {
          pretty: true,
          data: function () {
            return require('./softwerkskammer/frontendtests/fixtures/locals');
          }
        },
        files: {
          'softwerkskammer/frontendtests/fixtures/forms.html': 'softwerkskammer/frontendtests/fixtures/forms.jade'
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

  grunt.registerTask('prepare', ['bower-install-simple', 'copy', 'patch', 'less']);
  grunt.registerTask('frontendtests', ['clean', 'prepare', 'jade', 'uglify:production_de', 'karma:once', 'uglify:development_de', 'karma:once', 'istanbul_check_coverage:frontend']);
  grunt.registerTask('tests', ['jslint', 'frontendtests', 'mocha_istanbul', 'istanbul_check_coverage:server']);
  grunt.registerTask('deploy_development', ['prepare', 'uglify:development_de', 'uglify:development_en']);

  // Default task.
  grunt.registerTask('default', ['tests', 'uglify:development_en']);

  grunt.registerTask('deploy_production', ['clean', 'prepare', 'uglify:production_de', 'uglify:production_en']);
};
