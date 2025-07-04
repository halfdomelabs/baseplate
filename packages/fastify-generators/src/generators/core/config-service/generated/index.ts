import { CORE_CONFIG_SERVICE_PATHS } from './template-paths.js';
import { CORE_CONFIG_SERVICE_RENDERERS } from './template-renderers.js';
import { CORE_CONFIG_SERVICE_IMPORTS } from './ts-import-providers.js';
import { CORE_CONFIG_SERVICE_TEMPLATES } from './typed-templates.js';

export const CORE_CONFIG_SERVICE_GENERATED = {
  imports: CORE_CONFIG_SERVICE_IMPORTS,
  paths: CORE_CONFIG_SERVICE_PATHS,
  renderers: CORE_CONFIG_SERVICE_RENDERERS,
  templates: CORE_CONFIG_SERVICE_TEMPLATES,
};
