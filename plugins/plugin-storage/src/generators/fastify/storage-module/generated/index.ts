import { FASTIFY_STORAGE_MODULE_PATHS } from './template-paths.js';
import { FASTIFY_STORAGE_MODULE_IMPORTS } from './ts-import-providers.js';
import { FASTIFY_STORAGE_MODULE_TEMPLATES } from './typed-templates.js';

export const FASTIFY_STORAGE_MODULE_GENERATED = {
  imports: FASTIFY_STORAGE_MODULE_IMPORTS,
  paths: FASTIFY_STORAGE_MODULE_PATHS,
  templates: FASTIFY_STORAGE_MODULE_TEMPLATES,
};
