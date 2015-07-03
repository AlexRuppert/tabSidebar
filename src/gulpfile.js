var gulp = require('gulp');
var source = require('vinyl-source-stream');
var es = require('event-stream');
var browserify = require('browserify');
var concat = require('gulp-concat');
var watchify = require('watchify');
var reactify = require('reactify');
var streamify = require('gulp-streamify');
var uglify = require('gulp-uglify');
var less = require('gulp-less');
var minifyCSS = require('gulp-minify-css');
var minifyHTML = require('gulp-minify-html');
var jsonminify = require('gulp-jsonminify');
var htmlreplace = require('gulp-html-replace');

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
  gulp.src(['./app/logic/**/*.js', './app/bower_components/classnames/index.js'])

 .pipe(concat('logic.built.js'))
 .pipe(gulp.dest('./app/js/'));
  watcher.on('update', function () {
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
  gulp.src(['./app/logic/**/*.js', './app/bower_components/classnames/index.js'])
 .pipe(concat('logic.built.js'))
 .pipe(gulp.dest('./app/js/'));
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

  es.concat([

    gulp.src(['./app/logic/GroupManager.js',
      './app/logic/observer.js',
      './app/logic/Persistency.js',
      './app/logic/TabManager.js',
      './app/bower_components/tinycolor/tinycolor.js',
      './app/bower_components/classnames/index.js',
      './app/bower_components/react/react-with-addons.min.js'])
    .pipe(streamify(uglify())),

    browserify({
      entries: [path.REACT_ENTRY],
      transform: [reactify]
    })
    .bundle()
    .pipe(source(path.REACT_BUILD))
    .pipe(streamify(uglify()))
   // .pipe(gulp.dest(path.RELEASE + path.REACT_DEST)),

  ]).pipe(streamify(concat('all.built.js')))
    .pipe(gulp.dest(path.RELEASE + path.REACT_DEST));

  es.concat([
    gulp.src('./app/logic/Persistency.js')
    .pipe(streamify(uglify())),

    browserify({
      entries: [path.OPTIONS_ENTRY]
    })
    .bundle()
    .pipe(source(path.OPTIONS_BUILD))
    .pipe(streamify(uglify()))

  ]).pipe(streamify(concat('options.built.js')))
  .pipe(gulp.dest(path.RELEASE + path.OPTIONS_DEST));

  gulp.src('./app/logic/background.js')
  .pipe(uglify())
  .pipe(gulp.dest(path.RELEASE + "/app/logic"));
  gulp.src('./app/logic/observer.js')
  .pipe(uglify())
  .pipe(gulp.dest(path.RELEASE + "/app/logic"));

  //copy stuff
  gulp.src('./manifest.json')
  .pipe(gulp.dest(path.RELEASE));

  gulp.src('./app/logic/Persistency.js')
  .pipe(gulp.dest(path.RELEASE + '/app/js'));

  gulp.src('./app/bower_components/font-awesome/css/font-awesome.min.css')
   .pipe(gulp.dest(path.RELEASE + '/app/css/'));
  gulp.src('./app/bower_components/font-awesome/fonts/**/*.woff2')
   .pipe(gulp.dest(path.RELEASE + '/app/fonts'));
  gulp.src('./app/media/**/*.{png,ico,jpeg}')
  .pipe(gulp.dest(path.RELEASE + '/app/media'));

  gulp.src('./app/options.html')
  .pipe(htmlreplace({
    'css': 'css/options.css',
    'js': 'js/options.built.js'
  }))
  .pipe(minifyHTML())
  .pipe(gulp.dest(path.RELEASE + '/app/'));

  gulp.src('./app/info.html')
 .pipe(htmlreplace({
   'css': 'css/info.css',
   'js': 'js/options.built.js'
 }))
 .pipe(minifyHTML())
 .pipe(gulp.dest(path.RELEASE + '/app/'));

  gulp.src('./app/panel.html')
  .pipe(htmlreplace({
    'css': 'css/all.css',
    'js': 'js/all.built.js'
  }))
  .pipe(minifyHTML())
  .pipe(gulp.dest(path.RELEASE + '/app/'));
  gulp.src('./_locales/**/*.json')
  .pipe(jsonminify())
  .pipe(gulp.dest(path.RELEASE + '/_locales/'));
  //css
  gulp.src('./app/css/options.less')
  .pipe(less())
  .pipe(minifyCSS())
  .pipe(gulp.dest(path.RELEASE + '/app/css/'));

  gulp.src('./app/css/info.less')
  .pipe(less())
  .pipe(minifyCSS())
  .pipe(gulp.dest(path.RELEASE + '/app/css/'));

  gulp.src(['./app/css/panel.less', './app/bower_components/font-awesome/less/font-awesome.less'])
  .pipe(less())
  .pipe(minifyCSS())
  .pipe(concat('all.css'))
  .pipe(gulp.dest(path.RELEASE + '/app/css/'));
});