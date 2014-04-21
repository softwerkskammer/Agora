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
    jshint: {
      files: ['**/*.js', '**/*.json', '.jshintrc', '!coverage/**/*.js', '!coverage/**/*.json', '!node_modules/**/*.js', '!node_modules/**/*.json', '!public/**/*.js', '!public/**/*.json', '!frontendtests/lib/**/*.js', '!frontendtests/lib/**/*.json', '!locales/*.js'],
      options: {
        jshintrc: '.jshintrc'
      }
    },
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
      }
    },
    watch: {
      files: ['<%= jshint.files %>', '**/*.jade'],
      tasks: ['default']
    },
    qunit: {
      files: ['frontendtests/*.html']
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
          root: 'lib',
          mask: '**/*.js',
          reporter: 'spec'
        }
      },
      test: {
        src: 'test', // the folder, not the files,
        options: {
          root: 'lib',
          mask: '**/*.js',
          reporter: 'spec',
          check: {
            lines: 78,
            statements: 74
          }
        }
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-mocha-istanbul');
  grunt.loadNpmTasks('grunt-jslint');

  // Default task.
  grunt.registerTask('default', ['less', 'concat', 'jslint:server', 'jslint:servertests', 'jshint', 'qunit', 'mocha_istanbul']);

  // Travis-CI task
  grunt.registerTask('travis', ['default']);
};
