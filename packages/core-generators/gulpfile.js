const gulp = require('gulp');
const ts = require('gulp-typescript');

const tsProject = ts.createProject('tsconfig.json');

function buildTypescript() {
  return gulp.src('src/**/*.ts').pipe(tsProject()).pipe(gulp.dest('lib/'));
}

function buildTemplates() {
  return gulp
    .src('src/generators/*/templates/**/*')
    .pipe(gulp.dest('lib/generators/'));
}

const build = gulp.parallel(buildTypescript, buildTemplates);
exports.build = build;

function watch() {
  gulp.watch('src/**/*.ts', buildTypescript);
  gulp.watch('src/generators/*/templates/**/*', buildTemplates);
}

exports.watch = watch;

exports.default = build;
