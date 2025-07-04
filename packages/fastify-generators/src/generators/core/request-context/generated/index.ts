import { CORE_REQUEST_CONTEXT_PATHS } from './template-paths.js';
import { CORE_REQUEST_CONTEXT_RENDERERS } from './template-renderers.js';
import { CORE_REQUEST_CONTEXT_IMPORTS } from './ts-import-providers.js';
import { CORE_REQUEST_CONTEXT_TEMPLATES } from './typed-templates.js';

export const CORE_REQUEST_CONTEXT_GENERATED = {
  imports: CORE_REQUEST_CONTEXT_IMPORTS,
  paths: CORE_REQUEST_CONTEXT_PATHS,
  renderers: CORE_REQUEST_CONTEXT_RENDERERS,
  templates: CORE_REQUEST_CONTEXT_TEMPLATES,
};
