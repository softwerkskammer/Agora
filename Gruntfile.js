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
    'mocha-hack': {
      options: {
        globals: ['should'],
        timeout: 5000,
        ignoreLeaks: false,
        ui: 'bdd',
        reporter: 'spec'
      },

      all: { src: ['test/**/*.js']}
    },
    qunit: {
      files: ['frontendtests/*.html']
    },
    exec: {
      mkGenDocsDir: {
        command: 'mkdir -p docs/generated'
      },
      coverage: {
        command: 'mocha --require blanket --reporter html-cov --slow 0 test/**/*.js > docs/generated/coverage.html'
      }
    },
    clean: {
      tests: {
        src: ["docs"]
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-hack');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-exec');


  // Default task.
  grunt.registerTask('default', ['jshint', 'mocha-hack', 'qunit']);

  // Dev task
  grunt.registerTask('dev', ['jshint', 'mocha-hack', 'qunit']);

  // Coverage tasks
  grunt.registerTask('coverage', ['clean', 'exec:mkGenDocsDir', 'exec:coverage']);

  // Travis-CI task
  grunt.registerTask('travis', ['default']);
};
