import { createTextTemplateFile } from '@halfdomelabs/sync';

const ReadmeTextTemplate = createTextTemplateFile({
  name: 'readme',
  source: { path: 'README.md' },
  variables: { TPL_PROJECT_NAME: { description: 'Name of the project' } },
});

const ViteEnvTextTemplate = createTextTemplateFile({
  name: 'vite-env',
  source: { path: 'src/vite-env.d.ts' },
  variables: {},
});

const IndexHtmlTextTemplate = createTextTemplateFile({
  name: 'index-html',
  source: { path: 'index.html' },
  variables: {
    TPL_DESCRIPTION: { description: 'Description of the project' },
    TPL_TITLE: { description: 'Title of the home page' },
  },
});

export const CORE_REACT_TEXT_TEMPLATES = {
  ReadmeTextTemplate,
  ViteEnvTextTemplate,
  IndexHtmlTextTemplate,
};
