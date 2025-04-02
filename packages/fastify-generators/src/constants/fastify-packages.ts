export const FASTIFY_PACKAGES = {
  // Fastify
  fastify: '5.1.0',
  '@fastify/helmet': '13.0.0',
  'fastify-plugin': '5.0.1',
  nanoid: '3.3.8',

  pino: '9.5.0',
  'pino-pretty': '13.0.0',

  'altair-fastify-plugin': '8.0.4',
  graphql: '16.9.0',
  '@envelop/core': '5.0.1',
  '@envelop/disable-introspection': '6.0.0',
  'graphql-yoga': '5.6.1',

  '@envelop/types': '5.0.0',
  '@types/ws': '8.5.13',

  '@fastify/websocket': '11.0.1',
  '@fastify/request-context': '6.0.1',
  '@fastify/formbody': '8.0.1',
  '@fastify/cookie': '11.0.1',
  'fastify-raw-body': '5.0.0',

  // Pothos
  '@pothos/core': '4.3.0',
  '@pothos/plugin-simple-objects': '4.1.0',
  '@pothos/plugin-relay': '4.3.0',
  '@pothos/plugin-prisma': '4.3.1',

  '@graphql-yoga/redis-event-target': '2.0.0',
  'graphql-ws': '5.16.0',

  // Bull Board
  '@bull-board/api': '6.5.3',
  '@bull-board/fastify': '6.5.3',

  // Prisma
  '@prisma/client': '5.19.1',
  '@prisma/instrumentation': '5.19.1',
  prisma: '5.19.1',

  // Utils
  ms: '2.1.3',
  '@types/redis-info': '3.0.3',
  '@types/ms': '0.7.34',
  lodash: '4.17.21',
  '@types/lodash': '4.17.7',
  uuid: '9.0.0',
  '@types/uuid': '9.0.1',

  // Environment
  'cross-env': '7.0.3',
  dotenv: '16.3.1',

  // Compilation
  'tsc-alias': '1.8.10',
  tsx: '4.19.3',
  '@types/node': `^22.0.0`,

  // Redis
  ioredis: '5.3.2',
  'ioredis-mock': '8.7.0',

  // Sentry
  '@sentry/core': '9.10.1',
  '@sentry/node': '9.10.1',
  '@sentry/profiling-node': '9.10.1',

  // Validation
  zod: '3.24.1',

  // Testing
  'vitest-mock-extended': '1.3.2',
  'pg-connection-string': '2.6.4',

  // Auth
  '@node-rs/argon2': '2.0.2',
  auth0: '4.0.2',

  // Postmark
  postmark: '4.0.2',

  // Sendgrid
  '@sendgrid/mail': '8.1.0',

  // Stripe
  stripe: '14.5.0',
} as const;
