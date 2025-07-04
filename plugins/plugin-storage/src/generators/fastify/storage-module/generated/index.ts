import { FASTIFY_STORAGE_MODULE_PATHS } from './template-paths.js';
import { FASTIFY_STORAGE_MODULE_RENDERERS } from './template-renderers.js';
import { FASTIFY_STORAGE_MODULE_IMPORTS } from './ts-import-providers.js';
import { FASTIFY_STORAGE_MODULE_TEMPLATES } from './typed-templates.js';

export const FASTIFY_STORAGE_MODULE_GENERATED = {
  imports: FASTIFY_STORAGE_MODULE_IMPORTS,
  paths: FASTIFY_STORAGE_MODULE_PATHS,
  renderers: FASTIFY_STORAGE_MODULE_RENDERERS,
  templates: FASTIFY_STORAGE_MODULE_TEMPLATES,
};
