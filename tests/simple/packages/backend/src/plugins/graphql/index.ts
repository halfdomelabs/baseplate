import fs from 'fs/promises';
import { useDisableIntrospection } from '@envelop/disable-introspection';
import { requestContext } from '@fastify/request-context';
import { AltairFastify } from 'altair-fastify-plugin';
import { FastifyReply, FastifyRequest, RouteHandlerMethod } from 'fastify';
import fp from 'fastify-plugin';
import { GraphQLError, lexicographicSortSchema, printSchema } from 'graphql';
import { createYoga } from 'graphql-yoga';
import { config } from '@src/services/config.js';
import { logger } from '@src/services/logger.js';
import { HttpError } from '@src/utils/http-errors.js';
import { createContextFromRequest } from '@src/utils/request-service-context.js';
import { builder } from './builder.js';
import { useGraphLogger } from './useGraphLogger.js';
import { useSentry } from './useSentry.js';

import '@src/modules/index.js';

const IS_DEVELOPMENT = config.APP_ENVIRONMENT === 'development';

const schema = builder.toSchema();

async function writeSchemaToFile(): Promise<void> {
  // only write the schema to file if it has changed to avoid unnecessary GraphQL codegen generations
  const existingSchema = await fs
    .readFile('./schema.graphql', 'utf-8')
    .catch(() => undefined);
  const newSchema = printSchema(lexicographicSortSchema(schema));
  if (existingSchema !== newSchema) {
    await fs.writeFile('./schema.graphql', newSchema);
  }

  if (process.argv.includes('--exit-after-generate-schema')) {
    process.exit(0);
  }
}

if (IS_DEVELOPMENT) {
  writeSchemaToFile().catch((err) => logger.error(err));
}

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

        if (originalError instanceof HttpError) {
          return new GraphQLError(originalError.message, {
            ...error,
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
          ...error,
          extensions: {
            ...error.extensions,
            code: 'INTERNAL_SERVER_ERROR',
            statusCode: 500,
            reqId: requestContext.get('reqInfo')?.id,
            originalError: isDev
              ? {
                  message: originalError?.message ?? error.message,
                  stack: originalError?.stack ?? error.stack,
                }
              : undefined,
          },
        });
      },
    },
    plugins: [
      useGraphLogger(),
      useDisableIntrospection({ disableIf: () => !IS_DEVELOPMENT }),
      useSentry(),
    ],
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
    /* eslint-disable @typescript-eslint/no-floating-promises */

    response.headers.forEach((value, key) => {
      reply.header(key, value);
    });

    reply.status(response.status);
    reply.send(response.body);

    return reply;
  };

  fastify.route({
    url: '/graphql',
    method: ['GET', 'POST', 'OPTIONS'],
    handler: httpHandler,
  });

  if (IS_DEVELOPMENT) {
    await fastify.register(AltairFastify, {
      path: '/altair',
      baseURL: '/altair/',
      endpointURL: '/graphql',
    });
  }
});
