import { NODE_VITEST_PATHS } from './template-paths.js';
import { NODE_VITEST_RENDERERS } from './template-renderers.js';
import { NODE_VITEST_IMPORTS } from './ts-import-providers.js';
import { NODE_VITEST_TEMPLATES } from './typed-templates.js';

export const NODE_VITEST_GENERATED = {
  imports: NODE_VITEST_IMPORTS,
  paths: NODE_VITEST_PATHS,
  renderers: NODE_VITEST_RENDERERS,
  templates: NODE_VITEST_TEMPLATES,
};
