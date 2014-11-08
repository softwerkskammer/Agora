module.exports = function (grunt) {
  'use strict';

  // set up common objects for jslint
  var jsLintStandardOptions = {edition: 'latest', errorsOnly: true, failOnError: true};

  // filesets for uglify
  var files = {
    'socrates/public/clientscripts/global.js': [
      'bower_components/jquery/dist/jquery.js',
      'bower_components/bootstrap/dist/js/bootstrap.js',
      'bower_components/URIjs/src/URI.js',
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
      fontawesomeFONTS: {
        src: 'bower_components/font-awesome/fonts/*',
        dest: 'socrates/public/fonts',
        expand: true,
        flatten: true
      },
      customLESS: {
        src: 'socrates/frontend/less/*',
        dest: 'socrates/build/stylesheets/less',
        expand: true,
        flatten: true
      }
    },
    jslint: {
      server: {
        src: [
          'socrates/*.js',
          'socrates/lib/**/*.js'
        ],
        directives: {
          indent: 2,
          node: true,
          nomen: true,
          todo: true,
          unparam: true,
          vars: true
        },
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
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-jslint');

  grunt.registerTask('prepare', ['bower-install-simple', 'copy', 'less', 'jslint']);
  grunt.registerTask('deploy_development', ['prepare', 'uglify:development']);
  grunt.registerTask('deploy_production', ['prepare', 'uglify:production']);

  // Default task.
  grunt.registerTask('default', ['deploy_development']);
};
