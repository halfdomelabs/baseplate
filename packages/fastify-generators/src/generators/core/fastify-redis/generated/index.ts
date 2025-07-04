import { CORE_FASTIFY_REDIS_PATHS } from './template-paths.js';
import { CORE_FASTIFY_REDIS_RENDERERS } from './template-renderers.js';
import { CORE_FASTIFY_REDIS_IMPORTS } from './ts-import-providers.js';
import { CORE_FASTIFY_REDIS_TEMPLATES } from './typed-templates.js';

export const CORE_FASTIFY_REDIS_GENERATED = {
  imports: CORE_FASTIFY_REDIS_IMPORTS,
  paths: CORE_FASTIFY_REDIS_PATHS,
  renderers: CORE_FASTIFY_REDIS_RENDERERS,
  templates: CORE_FASTIFY_REDIS_TEMPLATES,
};
