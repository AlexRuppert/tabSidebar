var gulp = require('gulp');
var uglify = require('gulp-uglify');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var watchify = require('watchify');
var reactify = require('reactify');
var streamify = require('gulp-streamify');

var path = {
  REACT: './app/react_components/**/*.jsx',
  REACT_ENTRY: './app/react_components/root.jsx',
  REACT_BUILD: 'react.built.js',
  REACT_DEST: './app/js',

  OPTIONS: './app/optionsJS/**/*.js',
  OPTIONS_ENTRY: './app/optionsJS/options.js',
  OPTIONS_BUILD: 'options.built.js',
  OPTIONS_DEST: './app/js',
};
gulp.task('watch', function () {
  var watcher = watchify(browserify({
    entries: [path.REACT_ENTRY],
    transform: [reactify],
    debug: true,
    cache: {}, packageCache: {}, fullPaths: true
  }));

  return watcher.on('update', function () {
    watcher.bundle()
      .pipe(source(path.REACT_BUILD))
      .pipe(gulp.dest(path.REACT_DEST));
    var currentdate = new Date();
    console.log(currentdate.getHours() + ":"
   + currentdate.getMinutes() + ":" + currentdate.getSeconds() + ' Updated');
  })
    .bundle()
    .pipe(source(path.REACT_BUILD))
    .pipe(gulp.dest(path.REACT_DEST));
});

gulp.task('options', function () {
  browserify({
    entries: [path.OPTIONS_ENTRY]
  })
    .bundle()
    .pipe(source(path.OPTIONS_BUILD))
    .pipe(gulp.dest(path.OPTIONS_DEST));
});

gulp.task('default', function () {
  browserify({
    entries: [path.REACT_ENTRY],
    transform: [reactify]
  })
    .bundle()
    .pipe(source(path.REACT_BUILD))
    .pipe(gulp.dest(path.REACT_DEST));
});