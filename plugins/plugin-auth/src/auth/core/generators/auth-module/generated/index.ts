import { FASTIFY_AUTH_MODULE_PATHS } from './template-paths.js';
import { FASTIFY_AUTH_MODULE_IMPORTS } from './ts-import-providers.js';
import { FASTIFY_AUTH_MODULE_TEMPLATES } from './typed-templates.js';

export const FASTIFY_AUTH_MODULE_GENERATED = {
  imports: FASTIFY_AUTH_MODULE_IMPORTS,
  paths: FASTIFY_AUTH_MODULE_PATHS,
  templates: FASTIFY_AUTH_MODULE_TEMPLATES,
};
