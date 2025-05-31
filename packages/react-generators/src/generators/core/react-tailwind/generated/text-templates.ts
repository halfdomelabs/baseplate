import {
  createTextTemplateFile,
  createTextTemplateGroup,
} from '@baseplate-dev/sync';

const indexCss = createTextTemplateFile({
  name: 'index-css',
  group: 'main',
  source: { path: 'src/index.css' },
  variables: {
    TPL_GLOBAL_STYLES: { description: 'Global styles to apply to the app' },
  },
});

const postcssConfig = createTextTemplateFile({
  name: 'postcss-config',
  group: 'main',
  source: { path: 'postcss.config.js' },
  variables: {},
});

const tailwindConfig = createTextTemplateFile({
  name: 'tailwind-config',
  group: 'main',
  source: { path: 'tpl.tailwind.config.js' },
  variables: {},
});

const mainGroup = createTextTemplateGroup({
  templates: {
    indexCss: {
      destination: 'src/index.css',
      template: indexCss,
    },
    postcssConfig: {
      destination: 'postcss.config.js',
      template: postcssConfig,
    },
    tailwindConfig: {
      destination: 'tailwind.config.js',
      template: tailwindConfig,
    },
  },
});

export const CORE_REACT_TAILWIND_TEXT_TEMPLATES = {
  mainGroup,
};
