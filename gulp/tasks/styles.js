'use strict';

var gulp = require( 'gulp' );
var gulpAutoprefixer = require( 'gulp-autoprefixer' );
var gulpCssmin = require( 'gulp-cssmin' );
var gulpHeader = require( 'gulp-header' );
var gulpLess = require( 'gulp-less' );
var gulpSourcemaps = require( 'gulp-sourcemaps' );
var gulpRename = require( 'gulp-rename' );
var gulpUglify = require( 'gulp-uglify' );
var mqr = require( 'gulp-mq-remove' );
var config = require( '../config' );
var configPkg = config.pkg;
var configBanner = config.banner;
var configStyles = config.styles;
var handleErrors = require( '../utils/handle-errors' );
var browserSync = require( 'browser-sync' );

gulp.task( 'styles:modern', function() {
  return gulp.src( configStyles.cwd + configStyles.src )
    .pipe( gulpSourcemaps.init() )
    .pipe( gulpLess( configStyles.settings ) )
    .on( 'error', handleErrors )
    .pipe( gulpAutoprefixer( {
      browsers: [
        'last 2 version',
        'not ie <= 8',
        'android 4',
        'BlackBerry 7',
        'BlackBerry 10' ]
    } ) )
    .pipe( gulpHeader( configBanner, { pkg: configPkg } ) )
    .pipe( gulpRename( {
      suffix: '.min'
    } ) )
    .pipe( gulpSourcemaps.write( '.' ) )
    .pipe( gulp.dest( configStyles.dest ) )
    .pipe( browserSync.reload( {
      stream: true
    } ) );
} );

/**
 * Process legacy CSS for IE9 only.
 * @returns {PassThrough} A source stream.
 */
function stylesIE9() {
  return gulp.src( configStyles.cwd + configStyles.src )
    .pipe( gulpLess( configStyles.settings ) )
    .on( 'error', handleErrors )
    .pipe( gulpAutoprefixer( {
      browsers: [ 'ie 9' ]
    } ) )
    .pipe( gulpCssmin() )
    .pipe( gulpRename( {
      suffix:  '.ie9.min',
      extname: '.css'
    } ) )
    .pipe( gulp.dest( configStyles.dest ) )
    .pipe( browserSync.reload( {
      stream: true
    } ) );
}
gulp.task( 'styles:stylesIE9', stylesIE9 );

gulp.task( 'styles:stylesIE8', function() {
  return gulp.src( configStyles.cwd + configStyles.src )
    .pipe( gulpLess( configStyles.settings ) )
    .on( 'error', handleErrors )
    .pipe( gulpAutoprefixer( {
      browsers: [ 'ie 7-8' ]
    } ) )
    .pipe( mqr( {
      width: '75em'
    } ) )
    .pipe( gulpCssmin() )
    .pipe( gulpRename( {
      suffix:  '.ie8.min',
      extname: '.css'
    } ) )
    .pipe( gulp.dest( configStyles.dest ) )
    .pipe( browserSync.reload( {
      stream: true
    } ) );
} );

gulp.task( 'styles:chartsConcat', function() {
  return gulp.src( config.chartStyles.cwd + config.chartStyles.src )
    .pipe( gulpSourcemaps.init() )
    .pipe( gulpLess( {
      paths: config.chartStyles.settings.paths,
      compress: false
    } ) )
    .on( 'error', handleErrors )
    .pipe( gulpAutoprefixer( {
      browsers: [
        'last 2 version',
        'not ie <= 8',
        'android 4',
        'BlackBerry 7',
        'BlackBerry 10' ]
    } ) )
    .pipe( gulp.dest( config.chartStyles.dest ) )
    .pipe( browserSync.reload( {
      stream: true
    } ) );
} );

gulp.task( 'styles:chartsMinify', function() {
  return gulp.src( config.chartStyles.cwd + config.chartStyles.src )
    .pipe( gulpSourcemaps.init() )
    .pipe( gulpLess( config.chartStyles.settings ) )
    .on( 'error', handleErrors )
    .pipe( gulpAutoprefixer( {
      browsers: [
        'last 2 version',
        'not ie <= 8',
        'android 4',
        'BlackBerry 7',
        'BlackBerry 10' ]
    } ) )
    .pipe( gulpRename( {
      suffix: '.min'
    } ) )
    .pipe( gulp.dest( config.chartStyles.dest ) )
    .pipe( browserSync.reload( {
      stream: true
    } ) );
} );

gulp.task( 'styles:ie', [ 'styles:stylesIE8', 'styles:stylesIE9' ] );

gulp.task( 'styles:charts', [
  'styles:chartsConcat',
  'styles:chartsMinify'
] );

gulp.task( 'styles', [
  'styles:modern',
  'styles:charts',
  'styles:ie'
] );
