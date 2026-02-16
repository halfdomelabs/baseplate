export const FASTIFY_PACKAGES = {
  // Fastify
  fastify: '5.7.4',
  '@fastify/helmet': '13.0.0',
  'fastify-plugin': '5.1.0',
  nanoid: '5.1.6',

  pino: '9.5.0',
  'pino-pretty': '13.0.0',

  'altair-fastify-plugin': '8.0.4',
  graphql: '16.11.0',
  '@envelop/core': '5.3.0',
  '@envelop/disable-introspection': '8.0.0',
  'graphql-yoga': '5.15.1',

  '@envelop/types': '5.2.1',
  '@types/ws': '8.5.13',

  '@fastify/websocket': '11.0.1',
  '@fastify/request-context': '6.0.1',
  '@fastify/formbody': '8.0.1',
  '@fastify/cookie': '11.0.1',
  'fastify-raw-body': '5.0.0',

  // Pothos
  '@pothos/core': '4.10.0',
  '@pothos/plugin-simple-objects': '4.1.3',
  '@pothos/plugin-relay': '4.6.2',
  '@pothos/plugin-prisma': '4.14.1',
  '@pothos/plugin-validation': '4.2.0',
  'graphql-scalars': '1.23.0',

  '@graphql-yoga/redis-event-target': '2.0.0',
  'graphql-ws': '5.16.0',

  // Prisma
  '@prisma/client': '7.4.0',
  prisma: '7.4.0',
  '@prisma/adapter-pg': '7.4.0',

  // Utils
  ms: '2.1.3',
  '@types/redis-info': '3.0.3',
  '@types/ms': '0.7.34',
  'es-toolkit': '1.31.0',

  // Environment
  'cross-env': '7.0.3',
  concurrently: '9.2.1',

  // Compilation
  'tsc-alias': '1.8.10',
  tsx: '4.20.6',
  '@types/node': `^22.0.0`,

  // Redis
  ioredis: '5.8.1',

  // Sentry
  '@sentry/core': '9.17.0',
  '@sentry/node': '9.17.0',
  '@sentry/profiling-node': '9.17.0',
  '@pothos/plugin-tracing': '1.1.0',
  '@pothos/tracing-sentry': '1.1.1',

  // Validation
  zod: '4.3.6',

  // Testing
  'vitest-mock-extended': '3.1.0',
  'pg-connection-string': '2.6.4',

  // Auth
  '@node-rs/argon2': '2.0.2',

  // Postmark
  postmark: '4.0.5',

  // Stripe
  stripe: '14.5.0',

  // BullMQ
  bullmq: '5.61.2',
} as const;
