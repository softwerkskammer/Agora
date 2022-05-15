"use strict";
const sass = require("sass");

module.exports = function (grunt) {
  /*eslint camelcase: 0*/

  const commonJSfiles = [
    "node_modules/@popperjs/core/dist/umd/popper.js",
    "node_modules/bootstrap/dist/js/bootstrap.js",
    "node_modules/jquery/dist/jquery.js",
    "node_modules/select2/dist/js/select2.full.js",
    "node_modules/bootstrap-markdown/js/bootstrap-markdown.js",
    "node_modules/bootstrap-markdown/locale/bootstrap-markdown.de.js",
    "node_modules/smartmenus/dist/jquery.smartmenus.js",
    "node_modules/smartmenus/dist/addons/bootstrap-4/jquery.smartmenus.bootstrap-4.js",
    "node_modules/fullcalendar/main.js",
    "node_modules/jquery-validation/dist/jquery.validate.js",
    "node_modules/jquery-validation/dist/additional-methods.js",
  ];

  // filesets for uglify
  const files_de = {
    "softwerkskammer/public/clientscripts/global_de.js": commonJSfiles.concat([
      "node_modules/jquery-validation/dist/localization/messages_de.js",
      "node_modules/jquery-validation/dist/localization/methods_de.js",
      "node_modules/select2/dist/js/i18n/de.js",
      "node_modules/fullcalendar/locales/de.js",
      "locales/frontend_de.js",
      "softwerkskammer/frontend/javascript/agora.js",
    ]),
  };

  const files_en = {
    "softwerkskammer/public/clientscripts/global_en.js": commonJSfiles.concat([
      "node_modules/jquery-validation/dist/localization/messages_en.js",
      "node_modules/jquery-validation/dist/localization/methods_en.js",
      "node_modules/select2/dist/js/i18n/en.js",
      "node_modules/fullcalendar/locales/en-gb.js",
      "locales/frontend_en.js",
      "softwerkskammer/frontend/javascript/agora.js",
    ]),
  };

  const filesForCss = {
    "softwerkskammer/public/stylesheets/screen.css": [
      "node_modules/fullcalendar/main.css",
      "node_modules/smartmenus/dist/addons/bootstrap-4/jquery.smartmenus.bootstrap-4.css",
      "node_modules/@fortawesome/fontawesome-free/css/all.css",
      "node_modules/node-syntaxhighlighter/lib/styles/shCoreDefault.css",
      "node_modules/datatables.net-bs5/css/dataTables.bootstrap5.css",
      "node_modules/select2/dist/css/select2.css",
      "softwerkskammer/build/stylesheets/sass/out/agora.css",
    ],
  };
  grunt.initConfig({
    clean: {
      build: ["softwerkskammer/build", "softwerkskammer/frontendtests/fixtures/*.html"],
      coverage: [
        "softwerkskammer/coverage",
        "softwerkskammer/coverageWithDB",
        "softwerkskammer/karma-coverage",
        ".nyc_output",
      ],
      public: [
        "softwerkskammer/public/clientscripts",
        "softwerkskammer/public/fonts",
        "softwerkskammer/public/webfonts",
        "softwerkskammer/public/images",
        "softwerkskammer/public/stylesheets",
      ],
      options: { force: true },
    },
    copy: {
      datatablesJS: {
        src: "node_modules/datatables.net/js/*.js",
        dest: "softwerkskammer/public/clientscripts",
        expand: true,
        flatten: true,
      },
      datatablesBootstrapAndGermanJS: {
        src: ["node_modules/datatables.net-bs5/js/dataTables*", "softwerkskammer/frontend/3rd_party_js/dataTables*"],
        dest: "softwerkskammer/public/clientscripts",
        expand: true,
        flatten: true,
      },
      pickersJS: {
        src: [
          "node_modules/bootstrap-datepicker/dist/js/bootstrap-datepicker.min.js",
          "node_modules/bootstrap-datepicker/dist/locales/bootstrap-datepicker.de.min.js",
          "node_modules/bootstrap-datepicker/dist/locales/bootstrap-datepicker.en-GB.min.js",
          "node_modules/simple-timepicker/dist/simple-timepicker.min.js",
          "node_modules/guillotine/js/jquery.guillotine.min.js",
        ],
        dest: "softwerkskammer/public/clientscripts",
        expand: true,
        flatten: true,
      },
      pickerCSS: {
        src: [
          "node_modules/bootstrap-datepicker/dist/css/bootstrap-datepicker3.min.css",
          "node_modules/guillotine/css/jquery.guillotine.css",
        ],
        dest: "softwerkskammer/public/stylesheets",
        expand: true,
        flatten: true,
      },
      jqcloudAndColorsAndLeafletJS: {
        src: [
          "node_modules/jqcloud2/dist/jqcloud.min.js",
          "node_modules/tinycolor2/dist/tinycolor-min.js",
          "node_modules/tinygradient/browser.js",
          "node_modules/leaflet/dist/leaflet.js*",
        ],
        dest: "softwerkskammer/public/clientscripts",
        expand: true,
        flatten: true,
      },
      fontawesomeFONTS: {
        src: "node_modules/@fortawesome/fontawesome-free/webfonts/*",
        dest: "softwerkskammer/public/webfonts",
        expand: true,
        flatten: true,
      },
      leafletImages: {
        cwd: "node_modules/leaflet/dist/images",
        src: ["**"],
        dest: "softwerkskammer/public/stylesheets/images/",
        expand: true,
        flatten: false,
      },
      leafletCSS: {
        src: "node_modules/leaflet/dist/leaflet.css",
        dest: "softwerkskammer/public/stylesheets",
        expand: true,
        flatten: true,
      },
      customJS: {
        cwd: "softwerkskammer/frontend/javascript/",
        src: ["*", "!agora.js"],
        dest: "softwerkskammer/public/clientscripts",
        expand: true,
        flatten: false,
      },
      customSASS: {
        src: "softwerkskammer/frontend/sass/*",
        dest: "softwerkskammer/build/stylesheets/sass",
        expand: true,
        flatten: true,
      },
    },
    eslint: {
      options: { quiet: true },
      target: ["softwerkskammer/**/*.js"],
    },
    karma: {
      options: {
        configFile: "karma.conf.js",
      },
      once: {
        browsers: ["ChromeHeadless"],
        runnerPort: 6666,
        singleRun: true,
      },
    },
    sass: {
      options: {
        implementation: sass,
      },
      dist: {
        files: {
          "softwerkskammer/build/stylesheets/sass/out/agora.css": "softwerkskammer/build/stylesheets/sass/agora.scss",
        },
      },
    },
    cssmin: {
      target: {
        options: {
          level: 2,
        },
        files: filesForCss,
      },
    },
    uglify: {
      development_de: {
        options: {
          mangle: false,
          beautify: true,
        },
        files: files_de,
      },
      development_en: {
        options: {
          mangle: false,
          beautify: true,
        },
        files: files_en,
      },
      production_de: {
        files: files_de,
      },
      production_en: {
        files: files_en,
      },
    },

    pug: {
      compile: {
        options: {
          pretty: true,
          data: function () {
            return require("./softwerkskammer/frontendtests/fixtures/locals");
          },
        },
        files: {
          "softwerkskammer/frontendtests/fixtures/forms.html": "softwerkskammer/frontendtests/fixtures/forms.pug",
        },
      },
    },
    puglint: {
      standard: {
        options: {
          disallowAttributeInterpolation: true,
          disallowAttributeTemplateString: true,
          disallowDuplicateAttributes: true,
          disallowIdAttributeWithStaticValue: true,
          disallowLegacyMixinCall: true,
          disallowSpaceAfterCodeOperator: true,
          disallowTemplateString: true,
          requireClassLiteralsBeforeAttributes: true,
          requireIdLiteralsBeforeAttributes: true,
          requireLowerCaseTags: true,
          requireStrictEqualityOperators: true,
          validateAttributeQuoteMarks: "'",
          validateAttributeSeparator: ", ",
        },
        src: ["softwerkskammer/**/*.pug"],
      },
    },
    mochacli: {
      options: {
        exit: true,
        reporter: "dot",
        timeout: 6000,
      },
      testApp: {
        src: "softwerkskammer/testApp/**/*.js",
      },
      testWithDB: {
        src: "softwerkskammer/testWithDB/**/*.js",
      },
      test: {
        src: "softwerkskammer/test/**/*.js",
      },
    },
    nyc: {
      coverApp: {
        options: {
          include: ["softwerkskammer/**", "softwerkskammer/**"],
          reporter: "lcov",
          reportDir: "softwerkskammer/coverageApp",
        },
        cmd: false,
        args: ["grunt", "mochacli:testApp"],
      },
      coverWithDB: {
        options: {
          exclude: ["**/activitystore.js"],
          include: ["softwerkskammer/**", "softwerkskammer/**"],
          reporter: "lcov",
          reportDir: "softwerkskammer/coverageWithDB",
        },
        cmd: false,
        args: ["grunt", "mochacli:testWithDB"],
      },
      cover: {
        options: {
          include: ["softwerkskammer/**", "softwerkskammer/**"],
          reporter: "lcov",
          reportDir: "softwerkskammer/coverage",
        },
        cmd: false,
        args: ["grunt", "mochacli:test"],
      },
      report: {
        options: {
          lines: 81,
          statements: 77,
          "check-coverage": true,
          reporter: "text-summary",
        },
      },
    },
  });

  process.env.NODE_ICU_DATA = "node_modules/full-icu"; // necessary for timezone stuff

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-cssmin");
  grunt.loadNpmTasks("grunt-contrib-pug");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-eslint");
  grunt.loadNpmTasks("grunt-karma");
  grunt.loadNpmTasks("grunt-mocha-cli");
  grunt.loadNpmTasks("grunt-puglint");
  grunt.loadNpmTasks("grunt-sass");
  grunt.loadNpmTasks("grunt-simple-nyc");

  grunt.registerTask("prepare", ["clean", "copy"]);
  grunt.registerTask("frontendtests", [
    "clean",
    "prepare",
    "sass",
    "pug",
    "cssmin",
    "uglify:production_de",
    "karma:once",
    "uglify:development_de",
    "karma:once",
  ]);
  grunt.registerTask("tests", ["eslint", "puglint", "frontendtests", "nyc"]);
  grunt.registerTask("deploy_development", [
    "prepare",
    "sass",
    "cssmin",
    "uglify:development_de",
    "uglify:development_en",
  ]);

  // Default task.
  grunt.registerTask("default", ["tests", "uglify:development_en"]);

  grunt.registerTask("deploy_production", [
    "prepare",
    "sass",
    "cssmin",
    "uglify:production_de",
    "uglify:production_en",
  ]);
};
