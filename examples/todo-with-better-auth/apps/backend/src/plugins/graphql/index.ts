import type { FastifyReply, FastifyRequest, RouteHandlerMethod } from 'fastify';
import type { GraphQLErrorOptions } from 'graphql';

import { useDisableIntrospection } from '@envelop/disable-introspection';
import { requestContext } from '@fastify/request-context';
import { AltairFastify } from 'altair-fastify-plugin';
import fp from 'fastify-plugin';
import { GraphQLError, lexicographicSortSchema, printSchema } from 'graphql';
import { createYoga } from 'graphql-yoga';
import fs from 'node:fs/promises';

import { config } from '@src/services/config.js';
import { logger } from '@src/services/logger.js';
import { HttpError } from '@src/utils/http-errors.js';
import { createContextFromRequest } from '@src/utils/request-service-context.js';

import { builder } from './builder.js';
import { useGraphLogger } from './use-graph-logger.js';
import { useSentry } from './use-sentry.js';

/* TPL_SIDE_EFFECT_IMPORTS:START */
import '@src/modules/index.js';
/* TPL_SIDE_EFFECT_IMPORTS:END */

const IS_DEVELOPMENT = config.APP_ENVIRONMENT === 'dev';

const schema = /* TPL_SCHEMA:START */ builder.toSchema(); /* TPL_SCHEMA:END */

/* TPL_POST_SCHEMA_FRAGMENTS:START */

async function writeSchemaToFile(): Promise<void> {
  // only write the schema to file if it has changed to avoid unnecessary GraphQL codegen generations
  const existingSchema = await fs
    .readFile('./schema.graphql', 'utf8')
    .catch(() => undefined);
  const newSchema = printSchema(lexicographicSortSchema(schema));
  if (existingSchema !== newSchema) {
    await fs.writeFile('./schema.graphql', newSchema);
  }

  if (process.argv.includes('--exit-after-generate-schema')) {
    // eslint-disable-next-line unicorn/no-process-exit -- we want to exit after the schema is generated
    process.exit(0);
  }
}

if (IS_DEVELOPMENT && process.env.NODE_ENV !== 'test') {
  writeSchemaToFile().catch((err: unknown) => {
    logger.error(err);
  });
}
/* TPL_POST_SCHEMA_FRAGMENTS:END */

export const graphqlPlugin = fp(async (fastify) => {
  const graphQLServer = createYoga<{
    req: FastifyRequest;
    reply: FastifyReply;
  }>({
    logging: logger,
    context: ({ req, reply }) => createContextFromRequest(req, reply),
    schema,
    graphiql: IS_DEVELOPMENT,
    maskedErrors: {
      isDev: IS_DEVELOPMENT,
      maskError: (error, message, isDev) => {
        if (!(error instanceof GraphQLError)) {
          return new GraphQLError(message);
        }

        const { originalError } = error;

        // if we don't have an original error, it's a GraphQL error
        // which we can just return as-is
        if (!originalError) {
          return error;
        }

        const sharedOptions: GraphQLErrorOptions = {
          nodes: error.nodes,
          source: error.source,
          positions: error.positions,
          path: error.path,
        };

        if (originalError instanceof HttpError) {
          return new GraphQLError(originalError.message, {
            ...sharedOptions,
            extensions: {
              ...error.extensions,
              code: originalError.code,
              statusCode: originalError.statusCode,
              extraData: originalError.extraData,
              reqId: requestContext.get('reqInfo')?.id,
            },
          });
        }

        return new GraphQLError(message, {
          ...sharedOptions,
          extensions: {
            ...error.extensions,
            code: 'INTERNAL_SERVER_ERROR',
            statusCode: 500,
            reqId: requestContext.get('reqInfo')?.id,
            originalError: isDev
              ? {
                  message: originalError.message,
                  stack: originalError.stack,
                }
              : undefined,
          },
        });
      },
    },
    plugins: /* TPL_ENVELOP_PLUGINS:START */ [
      useDisableIntrospection({ disableIf: () => !IS_DEVELOPMENT }),
      useGraphLogger(),
      useSentry(),
    ] /* TPL_ENVELOP_PLUGINS:END */,
  });

  const httpHandler: RouteHandlerMethod = async (request, reply) => {
    const response = await graphQLServer.handleNodeRequestAndResponse(
      request,
      reply,
      {
        req: request,
        reply,
      },
    );

    // Fastify replies with promises that should not be awaited (https://github.com/typescript-eslint/typescript-eslint/issues/2640)

    for (const [key, value] of response.headers.entries()) {
      reply.header(key, value);
    }

    reply.status(response.status);
    reply.send(response.body);

    return reply;
  };

  /* TPL_GRAPHQL_HANDLER:START */
  fastify.route({
    url: '/graphql',
    method: ['GET', 'POST', 'OPTIONS'],
    handler: httpHandler,
  });
  /* TPL_GRAPHQL_HANDLER:END */

  if (IS_DEVELOPMENT) {
    await fastify.register(AltairFastify, {
      path: '/altair',
      baseURL: '/altair/',
      endpointURL: '/graphql',
    });
  }
});
