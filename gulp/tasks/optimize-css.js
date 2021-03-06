/**
 * optimize css in place for production
 * @tasks/optimize-css
 */
'use strict';
var cleanCSS = require('gulp-clean-css');
var util = require('gulp-util');
var flatten = require('gulp-flatten');
/**
 * @param gulp - function
 * @param options - object
 * options.src : Directory of images to optimize.
 * options.dist : Output directory.
 * @returns {Function}
 */
module.exports = function (gulp, options, flags) {

  try {
    return function () {
      var d1 = new Date();
        util.log('@tasks/optimize-css start ');
      return gulp.src(options.css.src)
        .pipe(cleanCSS({roundingPrecision:-1 }).on('error', util.log))
        .pipe (flatten({ includeParents: -1}))
        .pipe(gulp.dest(options.dist))
        .on('error', util.log)
        .on('finish', function () {
          var d2 = new Date();
          var seconds = (d2 - d1) / 1000;
          util.log('@tasks/optimize-css complete ', seconds + 's')
        })
    };
  } catch (err) {
    util.log(err);
  }
};