import { CORE_APP_MODULE_SETUP_PATHS } from './template-paths.js';
import { CORE_APP_MODULE_SETUP_RENDERERS } from './template-renderers.js';
import { CORE_APP_MODULE_SETUP_IMPORTS } from './ts-import-providers.js';
import { CORE_APP_MODULE_SETUP_TEMPLATES } from './typed-templates.js';

export const CORE_APP_MODULE_SETUP_GENERATED = {
  imports: CORE_APP_MODULE_SETUP_IMPORTS,
  paths: CORE_APP_MODULE_SETUP_PATHS,
  renderers: CORE_APP_MODULE_SETUP_RENDERERS,
  templates: CORE_APP_MODULE_SETUP_TEMPLATES,
};
