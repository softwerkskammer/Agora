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
      files: ['**/*.js', '**/*.json', '.jshintrc', '!node_modules/**/*.js', '!node_modules/**/*.json', '!public/**/*.js', '!public/**/*.json', '!frontendtests/lib/**/*.js', '!frontendtests/lib/**/*.json'],
      options: {
        jshintrc: '.jshintrc'
      }
    },
    watch: {
      files: ['<%= jshint.files %>', '**/*.jade'],
      tasks: ['default']
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          // Require blanket wrapper here to instrument other required
          // files on the fly. 
          //
          // NB. We cannot require blanket directly as it
          // detects that we are not running mocha cli and loads differently.
          //
          // NNB. As mocha is 'clever' enough to only run the tests once for
          // each file the following coverage task does not actually run any
          // tests which is why the coverage instrumentation has to be done here
          require: 'blanket',
          colors: true
        },
        src: ['test/**/*.js']
      },
      coverage: {
        options: {
          reporter: 'html-cov',
          // use the quiet flag to suppress the mocha console output
          quiet: true,
          // specify a destination file to capture the mocha
          // output (the quiet option does not suppress this)
          captureFile: 'coverage.html'
        },
        src: ['test/**/*.js']
      },
      'travis-cov': {
        options: {
          reporter: 'travis-cov'
        },
        src: ['test/**/*.js']
      }
    },
    qunit: {
      files: ['frontendtests/*.html']
    },
    sass: {
      default: {
        options: {
          outputStyle: 'compressed',
          sourceComments: 'none'
        },
        files: {
          'public/stylesheets/screen.css': 'public/stylesheets/screen.scss'
        }
      }
    },
    uglify: {
      options: {
        compress: {},
        report: 'min'
      },
      always: {
        files: {
          'public/clientscripts/global.js': [
            'public/clientscripts/global/jquery-1.9.1.js',
            'public/clientscripts/global/bootstrap.js',
            'public/clientscripts/global/bootstrap-datepicker.js',
            'public/clientscripts/global/bootstrap-markdown-patched.js',
            'public/clientscripts/global/markdown.js',
            'public/clientscripts/global/fullcalendar.js',
            'public/clientscripts/global/bootstrap-colorpicker.js',
            'public/clientscripts/global/bootstrap-datepicker.de.js',
            'public/clientscripts/global/jquery.validate-1.11.1.js',
            'public/clientscripts/global/additional-methods-1.11.1.js',
            'public/clientscripts/global/messages_de.js',
            'public/clientscripts/global/methods_de.js',
            'public/clientscripts/global/bootstrap-timepicker-patched.js',
            'public/clientscripts/global/agora.js'
          ]
        }
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-sass');

  // Default task.
  grunt.registerTask('default', ['sass', 'uglify', 'jshint', 'qunit', 'mochaTest']);

  // Travis-CI task
  grunt.registerTask('travis', ['default']);

};
