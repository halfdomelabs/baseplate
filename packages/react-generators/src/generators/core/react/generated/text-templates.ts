import {
  createTextTemplateFile,
  createTextTemplateGroup,
} from '@halfdomelabs/sync';

const readme = createTextTemplateFile({
  name: 'readme',
  group: 'static',
  source: { path: 'README.md' },
  variables: { TPL_PROJECT_NAME: { description: 'Name of the project' } },
});

const viteEnv = createTextTemplateFile({
  name: 'vite-env',
  group: 'static',
  source: { path: 'src/vite-env.d.ts' },
  variables: {},
});

const indexHtml = createTextTemplateFile({
  name: 'index-html',
  group: 'static',
  source: { path: 'index.html' },
  variables: {
    TPL_DESCRIPTION: { description: 'Description of the project' },
    TPL_TITLE: { description: 'Title of the home page' },
  },
});

const staticGroup = createTextTemplateGroup({
  templates: {
    readme: {
      destination: 'README.md',
      template: readme,
    },
    viteEnv: {
      destination: 'src/vite-env.d.ts',
      template: viteEnv,
    },
    indexHtml: {
      destination: 'index.html',
      template: indexHtml,
    },
  },
});

export const CORE_REACT_TEXT_TEMPLATES = {
  staticGroup,
};
