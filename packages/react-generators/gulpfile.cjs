const gulp = require('gulp');
const del = require('del');

const TEMPLATE_GLOBS = [
  'src/generators/*/*/templates/**',
  'src/generators/*/*/templates/**/.*',
];

function cleanTemplates() {
  return del(
    TEMPLATE_GLOBS.map((glob) =>
      glob.replace('src/generators', 'dist/generators')
    )
  );
}

function buildTemplates() {
  return gulp.src(TEMPLATE_GLOBS).pipe(gulp.dest('dist/generators/'));
}

exports.cleanTemplates = cleanTemplates;

exports.buildTemplates = gulp.series(cleanTemplates, buildTemplates);

function watchTemplates() {
  gulp.watch(TEMPLATE_GLOBS, buildTemplates);
}

exports.watchTemplates = gulp.series(
  cleanTemplates,
  buildTemplates,
  watchTemplates
);

exports.default = buildTemplates;
