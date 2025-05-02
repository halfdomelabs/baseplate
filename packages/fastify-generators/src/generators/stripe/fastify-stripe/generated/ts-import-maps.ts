import type { TsImportMapProviderFromSchema } from '@halfdomelabs/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@halfdomelabs/core-generators';
import { createReadOnlyProviderType } from '@halfdomelabs/sync';
import path from 'node:path/posix';

const fastifyStripeImportsSchema = createTsImportMapSchema({
  stripe: {},
  StripeEventHandler: { isTypeOnly: true },
  stripeEventService: {},
});

type FastifyStripeImportsProvider = TsImportMapProviderFromSchema<
  typeof fastifyStripeImportsSchema
>;

export const fastifyStripeImportsProvider =
  createReadOnlyProviderType<FastifyStripeImportsProvider>(
    'fastify-stripe-imports',
  );

export function createFastifyStripeImports(
  importBase: string,
): FastifyStripeImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(fastifyStripeImportsSchema, {
    stripe: path.join(importBase, 'stripe.js'),
    StripeEventHandler: path.join(importBase, 'stripe-events.js'),
    stripeEventService: path.join(importBase, 'stripe-events.js'),
  });
}
