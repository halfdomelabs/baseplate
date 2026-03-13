import { CORE_FASTIFY_SENTRY_PATHS } from './template-paths.js';
import { CORE_FASTIFY_SENTRY_RENDERERS } from './template-renderers.js';
import { CORE_FASTIFY_SENTRY_IMPORTS } from './ts-import-providers.js';
import { CORE_FASTIFY_SENTRY_TEMPLATES } from './typed-templates.js';

export const CORE_FASTIFY_SENTRY_GENERATED = {
  imports: CORE_FASTIFY_SENTRY_IMPORTS,
  paths: CORE_FASTIFY_SENTRY_PATHS,
  renderers: CORE_FASTIFY_SENTRY_RENDERERS,
  templates: CORE_FASTIFY_SENTRY_TEMPLATES,
};
