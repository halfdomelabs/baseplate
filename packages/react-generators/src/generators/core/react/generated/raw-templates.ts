import { createRawTemplateFile } from '@baseplate-dev/sync';

const favicon = createRawTemplateFile({
  name: 'favicon',
  source: { path: 'public/favicon.ico' },
});

export const CORE_REACT_RAW_TEMPLATES = {
  favicon,
};
