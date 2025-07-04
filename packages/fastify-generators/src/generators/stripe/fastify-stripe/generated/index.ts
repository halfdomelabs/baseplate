import { STRIPE_FASTIFY_STRIPE_PATHS } from './template-paths.js';
import { STRIPE_FASTIFY_STRIPE_RENDERERS } from './template-renderers.js';
import { STRIPE_FASTIFY_STRIPE_IMPORTS } from './ts-import-providers.js';
import { STRIPE_FASTIFY_STRIPE_TEMPLATES } from './typed-templates.js';

export const STRIPE_FASTIFY_STRIPE_GENERATED = {
  imports: STRIPE_FASTIFY_STRIPE_IMPORTS,
  paths: STRIPE_FASTIFY_STRIPE_PATHS,
  renderers: STRIPE_FASTIFY_STRIPE_RENDERERS,
  templates: STRIPE_FASTIFY_STRIPE_TEMPLATES,
};
