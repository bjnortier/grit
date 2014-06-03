var path = require('path');

module.exports = function(grunt) {

  grunt.initConfig({

    jshint: {
      options: {
        jshintrc: '.jshintrc',
      },
      gruntfile: {
        src: 'gruntfile.js'
      },
      lib: {
        src: 'lib/**/*.js',
      },
      unit: {
        src: 'test/unit/**/*.js',
      },
    },

    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib: {
        files: '<%= jshint.lib.src %>',
        tasks: ['jshint:lib', 'unit'],
      },
      unit: {
        files: '<%= jshint.unit.src %>',
        tasks: ['jshint:unit', 'unit']
      },
    },

    simplemocha: {
      options: {
        timeout: 3000,
        slow: 5000,
        ignoreLeaks: false,
        ui: 'bdd',
        reporter: 'spec',
        path: 'test'
      },
      unit: {
        src: '<%= jshint.unit.src %>',
      },
    },

  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-simple-mocha');

  // Unit testing
  grunt.registerTask('unit', ['jshint:lib', 'jshint:unit', 'simplemocha:unit']);
  grunt.registerTask('test', ['unit']);
  grunt.registerTask('default', ['test']);

};
