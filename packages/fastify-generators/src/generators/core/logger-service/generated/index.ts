import { CORE_LOGGER_SERVICE_PATHS } from './template-paths.js';
import { CORE_LOGGER_SERVICE_RENDERERS } from './template-renderers.js';
import { CORE_LOGGER_SERVICE_IMPORTS } from './ts-import-providers.js';
import { CORE_LOGGER_SERVICE_TEMPLATES } from './typed-templates.js';

export const CORE_LOGGER_SERVICE_GENERATED = {
  imports: CORE_LOGGER_SERVICE_IMPORTS,
  paths: CORE_LOGGER_SERVICE_PATHS,
  renderers: CORE_LOGGER_SERVICE_RENDERERS,
  templates: CORE_LOGGER_SERVICE_TEMPLATES,
};
