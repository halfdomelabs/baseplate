export const FASTIFY_PACKAGES = {
  // Fastify
  fastify: '5.8.5',
  '@fastify/helmet': '13.0.2',
  'fastify-plugin': '6.0.0',
  nanoid: '6.0.0',

  pino: '10.3.1',
  'pino-pretty': '13.1.3',

  graphql: '16.14.0',
  '@envelop/core': '5.3.0',
  '@envelop/disable-introspection': '8.0.0',
  'graphql-yoga': '5.15.1',

  '@envelop/types': '5.2.1',

  '@fastify/request-context': '6.2.1',
  '@fastify/formbody': '8.0.2',
  '@fastify/cookie': '11.0.2',
  'fastify-raw-body': '5.0.0',

  // Pothos
  '@pothos/core': '4.10.0',
  '@pothos/plugin-simple-objects': '4.1.3',
  '@pothos/plugin-relay': '4.6.2',
  '@pothos/plugin-prisma': '4.14.2',
  '@pothos/plugin-validation': '4.2.0',
  'graphql-scalars': '1.23.0',

  '@graphql-yoga/redis-event-target': '2.0.0',

  // Prisma
  '@prisma/client': '7.9.1',
  prisma: '7.9.1',
  '@prisma/adapter-pg': '7.9.1',

  // Utils
  ms: '2.1.3',
  '@types/redis-info': '3.0.3',
  '@types/ms': '0.7.34',
  'es-toolkit': '1.44.0',

  // Environment
  'cross-env': '10.1.0',
  concurrently: '10.0.4',

  // Compilation
  'tsc-alias': '1.8.10',
  tsx: '4.23.1',
  '@types/node': `^24.0.0`,

  // Redis
  // Held at 5.x: @graphql-yoga/redis-event-target peers ioredis ^5.0.6 and has
  // no release supporting 6.x.
  ioredis: '5.11.1',

  // Sentry
  '@sentry/core': '10.63.0',
  '@sentry/node': '10.63.0',
  '@sentry/profiling-node': '10.63.0',
  '@pothos/plugin-tracing': '1.1.0',
  '@pothos/tracing-sentry': '1.1.4',

  // Validation
  zod: '4.3.6',

  // Testing
  'vitest-mock-extended': '3.1.1',

  // Auth
  '@node-rs/argon2': '2.0.2',

  // Postmark
  postmark: '5.1.0',

  // Stripe
  stripe: '22.4.0',

  // BullMQ
  bullmq: '6.0.5',
} as const;
