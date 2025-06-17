import {
  createRawTemplateFile,
  createTextTemplateFile,
  createTsTemplateFile,
} from '@baseplate-dev/core-generators';
import path from 'node:path';

const favicon = createRawTemplateFile({
  name: 'favicon',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/package/public/favicon.ico',
    ),
  },
  fileOptions: { kind: 'singleton' },
});

const index = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'index',
  source: {
    path: path.join(import.meta.dirname, '../templates/src/index.tsx'),
  },
  variables: { TPL_APP: {}, TPL_HEADER: {} },
});

const indexHtml = createTextTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'static',
  name: 'index-html',
  source: {
    path: path.join(import.meta.dirname, '../templates/package/index.html'),
  },
  variables: {
    TPL_DESCRIPTION: { description: 'Description of the project' },
    TPL_TITLE: { description: 'Title of the home page' },
  },
});

const readme = createTextTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'static',
  name: 'readme',
  source: {
    path: path.join(import.meta.dirname, '../templates/package/README.md'),
  },
  variables: { TPL_PROJECT_NAME: { description: 'Name of the project' } },
});

const viteEnv = createTextTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'static',
  name: 'vite-env',
  source: {
    path: path.join(import.meta.dirname, '../templates/src/vite-env.d.ts'),
  },
  variables: {},
});

export const staticGroup = { indexHtml, readme, viteEnv };

const viteConfig = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'vite-config',
  source: {
    path: path.join(import.meta.dirname, '../templates/package/vite.config.ts'),
  },
  variables: { TPL_CONFIG: {} },
});

export const CORE_REACT_TEMPLATES = { staticGroup, viteConfig, index, favicon };
