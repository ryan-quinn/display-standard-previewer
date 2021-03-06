'use strict';
var gulp = require('gulp');
var config = require('./config');
var bs = require('browser-sync').create();
var util = require('gulp-util');
var path = require('path');
var checkTemplateType = function () {
  var fs = require("fs");
  var file = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  //console.log (file);
  //console.log("String"+(file.search('<meta templateType="215_MU">')>-1 ? " " : " not ")+"found");
  if (file.search('<meta name="template.type" content="215_MU">') > -1) {
    config = config('img', 'dist', 'js');
  } else {
  
    let root = process.cwd();
    
  
    let imagePath = '';
    let jsPath = '';
    
    
    if (fs.existsSync(path.join(root, 'images'))) {
  
      imagePath =  'images'
      
    }else if (fs.existsSync(path.join(root, 'img'))) {
  
      imagePath =  'img'
    }else {
  
      throw new Error('Image path is bad')
    }
  
    if (fs.existsSync(path.join(root, 'libs'))) {
  
      jsPath =  'libs'
    
    }else if (fs.existsSync(path.join(root, 'js'))) {
  
      jsPath =  'js'
    }else {
    
      throw new Error('JS path is bad')
    }
    
    console.log(root);
    console.log( imagePath);
    console.log(jsPath);
    
  
    config = config(imagePath, 'dist', jsPath);
    
    //config = config();
  }
};

module.exports = function (opts, task) {
  checkTemplateType();
  //console.log ("111",opts)
  return new Promise(function (resolve, reject) {
    var d1 = new Date();
    util.log('ALL tasks Start');
    gulp.task('dev', function (done) {
      config.flags.minify = false;
      config.flags.sourcemap = true;
      config.flags.type = 'dev';
      done();
    });
    gulp.task('prod', function (done) {
      console.log("!!!!", config.flags.sourcemap);
      config.flags.minify = true;
      config.flags.sourcemap = false;
      config.flags.type = 'prod';
      done();
    });
    gulp.task('resolve', function (done) {
      var d2 = new Date();
      var seconds = (d2 - d1) / 1000;
      util.log('ALL tasks complete', seconds + 's');
      resolve();
      done();
    });
    gulp.task('reload', function (done) {
      bs.reload();
      done();
    });
    gulp.task('sass', require('./tasks/lib-sass')(gulp, bs, config.sass, config.flags));
    gulp.task('sprite-collapsed-foreground', require('./tasks/sprite-images')(gulp, bs, config.sprite.collapsed_foreground, config.flags));
    gulp.task('sprite-collapsed-background', require('./tasks/sprite-images')(gulp, bs, config.sprite.collapsed_background, config.flags));
    gulp.task('sprite-all', gulp.parallel('sprite-collapsed-foreground', 'sprite-collapsed-background'));
    gulp.task('clean-dist', require('./tasks/clean')(gulp, config.build.clean));
    gulp.task('build-dist', require('./tasks/build')(gulp, bs, config.build, config.flags));
    gulp.task('rename-standard', require('./tasks/rename-standard')(gulp, bs, config.rename_backup, config.flags));
    gulp.task('optimize-css', require('./tasks/optimize-css')(gulp, config.optimize, config.flags));
    gulp.task('optimize-js', require('./tasks/optimize-js')(gulp, config.optimize, config.flags));
    gulp.task('optimize-html', require('./tasks/optimize-html')(gulp, config.optimize, config.flags));
    gulp.task('optimize-sprite-image', require('./tasks/optimize-sprite-image')(gulp, config.optimize, config.flags, opts.tinypngkey));
    gulp.task('scripts-vendor', require('./tasks/scripts-vendor')(gulp, bs, config.html, config.flags));
    gulp.task('bundle', require('./tasks/bundle-default')(gulp, config.bundle.default, config.flags));
    gulp.task('inline', require('./tasks/inline')(gulp, bs, config.inline, config.flags));
    gulp.task('inline-clean', require('./tasks/clean')(gulp, config.inline_clean));
    gulp.task('inline-svg', require('./tasks/inline-svg')(gulp, config.inline_svg));
    gulp.task('test', require('./tasks/test')(gulp, config.test));
    // define watch actions
    gulp.task('watch', function (done) {
      var callback = function () {
        resolve();
      };
      bs.init({
        server: {
          baseDir: config.server.root
        },
        online: false,
        port: opts.port,
        reloadDelay: 250,
        reloadDebounce: 250,
        ghostMode: {
          clicks: false,
          forms: false,
          scroll: false
        }
      }, callback);
      gulp.watch(config.sass.watch_src, gulp.series('sass')); // only watch files not associated with spritesheets
      // generate new sass partials for spritesheets when images edited
      gulp.watch(config.sprite.collapsed_foreground.src, gulp.series('sprite-collapsed-foreground'));
      gulp.watch(config.sprite.collapsed_background.src, gulp.series('sprite-collapsed-background'));
      gulp.watch(config.reload.src, gulp.series('reload'));
      gulp.watch(config.inline_svg.src, gulp.series('inline-svg','reload'));
      done();
    });
    if (task === 'watch') {
      gulp.series('inline-svg','sprite-all', 'sass', 'watch').call();
    } else if (task === 'end-watch') {
      bs.exit();
    } else if (task === 'sass') {
      gulp.series('sass', 'resolve').call();
    } else if (task === 'inline-svg') {
      gulp.series('inline-svg', 'resolve').call();
    }
    else if (task === 'test') {
      gulp.series('test', 'resolve').call();
    } else if (task === 'tinypng') {
      gulp.series('optimize-sprite-image', 'resolve').call();
    } else if (task === 'sprite') {
      gulp.series('sprite-all', 'resolve').call();
    } else if (task === 'build') {
      gulp.series('sprite-all', 'sass', 'resolve').call();
    } else if (task === 'build-dist') {
      gulp.series('prod','inline-svg', 'sprite-all', 'sass', 'clean-dist', 'build-dist', 'scripts-vendor', gulp.parallel(
        'optimize-css',
        /*'optimize-js',*/
        'optimize-html',
        'optimize-sprite-image',
        'rename-standard'
      ), 'inline', 'resolve').call();
      //gulp.series('prod', 'sprite-all', 'sass', 'clean-dist', 'build-dist', 'scripts-vendor', gulp.parallel('optimize-css', 'optimize-js', 'optimize-html','optimize-sprite-image', 'rename-standard'), 'inline',  'resolve').call();
    } else if (task === 'default') {
      gulp.series('inline-svg','sprite-all', 'sass', 'resolve').call();
    } else if (task === 'bundle') {
      gulp.series('bundle', 'test', 'resolve').call();
    } else {
      resolve()
    }
  });
};

/*
 ,
 'optimize-js',
 'optimize-html',
 'optimize-sprite-image',
 'rename-standard'
 'inline',
* */