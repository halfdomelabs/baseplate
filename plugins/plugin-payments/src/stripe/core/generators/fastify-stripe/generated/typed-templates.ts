import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import { configServiceImportsProvider } from '@baseplate-dev/fastify-generators';
import path from 'node:path';

const service = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'services',
  importMapProviders: { configServiceImports: configServiceImportsProvider },
  name: 'service',
  projectExports: { stripe: { isTypeOnly: false } },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/services/stripe.ts'),
  },
  variables: {},
});

export const servicesGroup = { service };

export const STRIPE_FASTIFY_STRIPE_TEMPLATES = { servicesGroup };
