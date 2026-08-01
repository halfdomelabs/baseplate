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
    TPL_DARK_COLORS: { description: 'Dark colors to apply to the app' },
    TPL_GLOBAL_STYLES: { description: 'Global styles to apply to the app' },
    TPL_LIGHT_COLORS: { description: 'Light colors to apply to the app' },
    TPL_SOURCE_DIRECTIVES: {
      description:
        'Tailwind @source directives for scanning imported library source files',
    },
  },
});

export const mainGroup = { stylesCss };

export const CORE_REACT_TAILWIND_TEMPLATES = { mainGroup };
