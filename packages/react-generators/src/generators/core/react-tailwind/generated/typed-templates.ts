import { createTextTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const stylesCss = createTextTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  name: 'styles-css',
  source: {
    path: path.join(import.meta.dirname, '../templates/src/styles.css'),
  },
  variables: {
    TPL_GLOBAL_STYLES: { description: 'Global styles to apply to the app' },
    TPL_LIGHT_COLORS: {
      description: 'CSS variable declarations for light mode theme colors',
    },
    TPL_DARK_COLORS: {
      description: 'CSS variable declarations for dark mode theme colors',
    },
  },
});

export const mainGroup = { stylesCss };

export const CORE_REACT_TAILWIND_TEMPLATES = { mainGroup };
