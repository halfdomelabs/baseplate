export const FASTIFY_PACKAGES = {
  // Fastify
  fastify: '5.3.2',
  '@fastify/helmet': '13.0.0',
  'fastify-plugin': '5.0.1',
  nanoid: '3.3.8',

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
  '@pothos/core': '4.8.1',
  '@pothos/plugin-simple-objects': '4.1.3',
  '@pothos/plugin-relay': '4.6.2',
  '@pothos/plugin-prisma': '4.10.0',
  'graphql-scalars': '1.23.0',

  '@graphql-yoga/redis-event-target': '2.0.0',
  'graphql-ws': '5.16.0',

  // Bull Board
  '@bull-board/api': '6.5.3',
  '@bull-board/fastify': '6.5.3',

  // Prisma
  '@prisma/client': '6.17.1',
  prisma: '6.17.1',

  // Utils
  ms: '2.1.3',
  '@types/redis-info': '3.0.3',
  '@types/ms': '0.7.34',
  'es-toolkit': '1.31.0',
  uuid: '9.0.0',
  '@types/uuid': '9.0.1',

  // Environment
  'cross-env': '7.0.3',

  // Compilation
  'tsc-alias': '1.8.10',
  tsx: '4.19.3',
  '@types/node': `^22.0.0`,

  // Redis
  ioredis: '5.3.2',
  'ioredis-mock': '8.7.0',

  // Sentry
  '@sentry/core': '9.17.0',
  '@sentry/node': '9.17.0',
  '@sentry/profiling-node': '9.17.0',
  '@pothos/plugin-tracing': '1.1.0',
  '@pothos/tracing-sentry': '1.1.1',

  // Validation
  zod: '3.25.76',

  // Testing
  'vitest-mock-extended': '1.3.2',
  'pg-connection-string': '2.6.4',

  // Auth
  '@node-rs/argon2': '2.0.2',

  // Postmark
  postmark: '4.0.2',

  // Stripe
  stripe: '14.5.0',

  // BullMQ
  bullmq: '5.1.1',
} as const;
