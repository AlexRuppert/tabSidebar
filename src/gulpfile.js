var gulp = require('gulp');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var watchify = require('watchify');
var reactify = require('reactify');
var streamify = require('gulp-streamify');
var uglify = require('gulp-uglify');
var less = require('gulp-less');
var minifyCSS = require('gulp-minify-css');
var minifyHTML = require('gulp-minify-html');

var path = {
  REACT: './app/react_components/**/*.jsx',
  REACT_ENTRY: './app/react_components/main/root.js',
  REACT_BUILD: 'react.built.js',
  REACT_DEST: './app/js',

  OPTIONS: './app/optionsJS/**/*.js',
  OPTIONS_ENTRY: './app/optionsJS/options.js',
  OPTIONS_BUILD: 'options.built.js',
  OPTIONS_DEST: './app/js',

  RELEASE: '../release/'
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

gulp.task('release', function () {
  
  //core js
  browserify({
    entries: [path.REACT_ENTRY],
    transform: [reactify]
  })
    .bundle()
    .pipe(source(path.REACT_BUILD))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest(path.RELEASE + path.REACT_DEST));

  browserify({
    entries: [path.OPTIONS_ENTRY]
  })
    .bundle()
    .pipe(source(path.OPTIONS_BUILD))
    .pipe(streamify(uglify()))
    .pipe(gulp.dest(path.RELEASE + path.OPTIONS_DEST));
  gulp.src('./app/logic/background.js')
  .pipe(uglify())
  .pipe(gulp.dest(path.RELEASE + "/app/logic"));
  //copy stuff
  gulp.src('./manifest.json')
  .pipe(gulp.dest(path.RELEASE));
  gulp.src('./app/bower_components/react/react-with-addons.min.js')
  .pipe(gulp.dest(path.RELEASE + '/app/bower_components/react'));
  gulp.src('./app/bower_components/classnames/index.js')
  .pipe(uglify())
  .pipe(gulp.dest(path.RELEASE + '/app/bower_components/classnames'));
  gulp.src('./app/bower_components/font-awesome/css/font-awesome.min.css')
  .pipe(gulp.dest(path.RELEASE + '/app/bower_components/font-awesome/css/'));
  gulp.src('./app/bower_components/font-awesome/fonts/**/*.woff2')
   .pipe(gulp.dest(path.RELEASE + '/app/bower_components/font-awesome/fonts'));
  gulp.src('./app/media/**/*.{png,ico,jpeg}')
  .pipe(gulp.dest(path.RELEASE + '/app/media'));
  gulp.src('./app/*.html')
  .pipe(minifyHTML())
  .pipe(gulp.dest(path.RELEASE + '/app/'));

  //css
  gulp.src('./app/css/*.less')
  .pipe(less())
  .pipe(minifyCSS())
  .pipe(gulp.dest(path.RELEASE + '/app/css/'));

  gulp.src('./app/css/*.less')
 .pipe(less())
 .pipe(minifyCSS())
 .pipe(gulp.dest(path.RELEASE + '/app/css/'));
});