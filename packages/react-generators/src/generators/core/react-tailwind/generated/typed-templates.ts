import { createTextTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const indexCss = createTextTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  name: 'index-css',
  source: {
    path: path.join(import.meta.dirname, '../templates/src/index.css'),
  },
  variables: {
    TPL_GLOBAL_STYLES: { description: 'Global styles to apply to the app' },
  },
});

const postcssConfig = createTextTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  name: 'postcss-config',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/package/postcss.config.js',
    ),
  },
  variables: {},
});

const tailwindConfig = createTextTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  name: 'tailwind-config',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/package/tailwind.config.js',
    ),
  },
  variables: {},
});

export const mainGroup = { indexCss, postcssConfig, tailwindConfig };

export const CORE_REACT_TAILWIND_TEMPLATES = { mainGroup };
