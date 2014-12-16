module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/* <%= pkg.name %>\n * version: <%= pkg.version %>\n * build: <%= grunt.template.today("yyyy-mm-dd") %> \n */\n'
      },
      build: {
        src: 'js/plugins.js',
        dest: 'build/js/plugins.min.js'
      }
    }
  });

  // 加载包含 "uglify" 任务的插件。
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // 默认被执行的任务列表。
  grunt.registerTask('default', ['uglify']);

};