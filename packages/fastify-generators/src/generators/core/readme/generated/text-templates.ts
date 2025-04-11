import { createTextTemplateFile } from '@halfdomelabs/sync';

const readme = createTextTemplateFile({
  name: 'readme',
  source: { path: 'README.md' },
  variables: { TPL_PROJECT: { description: 'Name of the project' } },
});

export const CORE_README_TEXT_TEMPLATES = {
  readme,
};
