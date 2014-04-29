module.exports = function (grunt) {
  // See http://www.jshint.com/docs/#strict
  "use strict";

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    jslint: {
      server: {
        src: [
          '*.js',
          'lib/**/*.js'
        ],
        directives: {
          indent: 2,
          node: true,
          nomen: true,
          todo: true,
          unparam: true,
          vars: true
        },
        options: {
          edition: 'latest',
          errorsOnly: true,
          failOnError: true
        }
      },
      servertests: {
        src: [
          'test/**/*.js',
          'testWithDB/**/*.js',
          'testutil/**/*.js'
        ],
        directives: {
          ass: true,
          indent: 2,
          node: true,
          nomen: true,
          todo: true,
          unparam: true,
          vars: true,
          predef: ['afterEach', 'after', 'beforeEach', 'before', 'describe', 'it']
        },
        options: {
          edition: 'latest',
          errorsOnly: true,
          failOnError: true
        }
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
        options: {
          edition: 'latest',
          errorsOnly: true,
          failOnError: true
        }
      },
      clienttests: {
        src: [
          'frontendtests/*.js',
          'frontendtests/fixtures/*.js'
        ],
        directives: {
          indent: 2,
          browser: true,
          es5: true,
          vars: true,
          predef: ['test', 'equal', 'deepEqual', 'start', 'stop', '$']
        },
        options: {
          edition: '2013-08-26',
          errorsOnly: true,
          failOnError: true
        }
      }
    },
    watch: {
      files: ['<%= jshint.files %>', '**/*.jade'],
      tasks: ['default']
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
    concat: {
      options: {
        separator: ';'
      },
      de: {
        src: [
          'locales/frontend_de.js',
          'node_modules/jquery/dist/jquery.js',
          'public/clientscripts/global/bootstrap.js',
          'public/clientscripts/global/bootstrap-datepicker.js',
          'public/clientscripts/global/bootstrap-markdown.js',
          'node_modules/moment-timezone/node_modules/moment/min/moment.min.js',
          'public/clientscripts/global/fullcalendar-patched.js',
          'public/clientscripts/global/de.js', // for fullcalendar
          'public/clientscripts/global/tinycolor-0.9.15.min.js', // for pick-a-color
          'public/clientscripts/global/pick-a-color.js',
          'public/clientscripts/global/bootstrap-datepicker.de.js',
          'node_modules/jquery-validation/jquery.validate.js',
          'node_modules/jquery-validation/additional-methods.js',
          'node_modules/jquery-validation/localization/messages_de.js',
          'node_modules/jquery-validation/localization/methods_de.js',
          'node_modules/bootstrap-timepicker/js/bootstrap-timepicker.js',
          'public/clientscripts/global/agora.js'
        ],
        dest: 'public/clientscripts/global_de.js'
      },
      en: {
        src: [
          'locales/frontend_en.js',
          'node_modules/jquery/dist/jquery.js',
          'public/clientscripts/global/bootstrap.js',
          'public/clientscripts/global/bootstrap-datepicker.js',
          'public/clientscripts/global/bootstrap-markdown.js',
          'node_modules/moment-timezone/node_modules/moment/min/moment.min.js',
          'public/clientscripts/global/fullcalendar-patched.js',
          'public/clientscripts/global/en-gb.js', // for fullcalendar
          'public/clientscripts/global/tinycolor-0.9.15.min.js', // for pick-a-color
          'public/clientscripts/global/pick-a-color.js',
          'node_modules/jquery-validation/jquery.validate.js',
          'node_modules/jquery-validation/additional-methods.js',
          'node_modules/bootstrap-timepicker/js/bootstrap-timepicker.js',
          'public/clientscripts/global/agora.js'
        ],
        dest: 'public/clientscripts/global_en.js'
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
            lines: 78,
            statements: 74
          }
        }
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-mocha-istanbul');
  grunt.loadNpmTasks('grunt-jslint');
  grunt.loadNpmTasks('grunt-karma');
  // Default task.
  grunt.registerTask('default', ['less', 'concat', 'jslint', 'karma:once', 'mocha_istanbul']);

  // Travis-CI task
  grunt.registerTask('travis', ['default']);
};
