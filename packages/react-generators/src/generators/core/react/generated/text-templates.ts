import {
  createTextTemplateFile,
  createTextTemplateGroup,
} from '@halfdomelabs/sync';

const indexHtml = createTextTemplateFile({
  name: 'index-html',
  group: 'static',
  source: { path: 'index.html' },
  variables: {
    TPL_DESCRIPTION: { description: 'Description of the project' },
    TPL_TITLE: { description: 'Title of the home page' },
  },
});

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

const staticGroup = createTextTemplateGroup({
  templates: {
    indexHtml: {
      destination: 'index.html',
      template: indexHtml,
    },
    readme: {
      destination: 'README.md',
      template: readme,
    },
    viteEnv: {
      destination: 'src/vite-env.d.ts',
      template: viteEnv,
    },
  },
});

export const CORE_REACT_TEXT_TEMPLATES = {
  staticGroup,
};
