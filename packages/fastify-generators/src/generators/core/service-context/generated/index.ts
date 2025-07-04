import { CORE_SERVICE_CONTEXT_PATHS } from './template-paths.js';
import { CORE_SERVICE_CONTEXT_RENDERERS } from './template-renderers.js';
import { CORE_SERVICE_CONTEXT_IMPORTS } from './ts-import-providers.js';
import { CORE_SERVICE_CONTEXT_TEMPLATES } from './typed-templates.js';

export const CORE_SERVICE_CONTEXT_GENERATED = {
  imports: CORE_SERVICE_CONTEXT_IMPORTS,
  paths: CORE_SERVICE_CONTEXT_PATHS,
  renderers: CORE_SERVICE_CONTEXT_RENDERERS,
  templates: CORE_SERVICE_CONTEXT_TEMPLATES,
};
