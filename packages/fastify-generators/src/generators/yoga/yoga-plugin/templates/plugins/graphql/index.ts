// @ts-nocheck

import { config } from '%config';
import { HttpError } from '%http-errors';
import { createContextFromRequest } from '%request-service-context';
import { requestContext } from '@fastify/request-context';
import { createYoga } from 'graphql-yoga';
import { logger } from '%logger-service';
import AltairFastify from 'altair-fastify-plugin';
import { FastifyReply, FastifyRequest, RouteHandlerMethod } from 'fastify';
import fp from 'fastify-plugin';
import { GraphQLError } from 'graphql';

CUSTOM_IMPORTS;

const IS_DEVELOPMENT = config.APP_ENVIRONMENT === 'development';

const schema = SCHEMA;

POST_SCHEMA_BLOCKS;

export const graphqlPlugin = fp(async (fastify) => {
  const graphQLServer = createYoga<{
    req: FastifyRequest;
    reply: FastifyReply;
  }>({
    logging: logger,
    context: ({ req, reply }) => createContextFromRequest(req, reply),
    schema,
    maskedErrors: {
      isDev: IS_DEVELOPMENT,
      maskError: (error, message, isDev) => {
        if (!(error instanceof GraphQLError)) {
          return new GraphQLError(message);
        }

        const { originalError } = error;

        if (originalError) {
          if (originalError instanceof HttpError) {
            return new GraphQLError(originalError.message, {
              ...error,
              extensions: {
                code: originalError.code,
                statusCode: originalError.statusCode,
                extraData: originalError.extraData,
                reqId: requestContext.get('reqInfo')?.id,
              },
            });
          }
        }

        return new GraphQLError(message, {
          ...error,
          extensions: {
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
    plugins: ENVELOP_PLUGINS,
  });

  const httpHandler: RouteHandlerMethod = async (request, reply) => {
    const response = await graphQLServer.handleNodeRequest(request, {
      req: request,
      reply,
    });

    // Fastify replies with promises that should not be awaited (https://github.com/typescript-eslint/typescript-eslint/issues/2640)
    /* eslint-disable @typescript-eslint/no-floating-promises */

    response.headers.forEach((value, key) => {
      reply.header(key, value);
    });

    reply.status(response.status);
    reply.send(response.body);

    return reply;
  };

  GRAPHQL_HANDLER;

  if (IS_DEVELOPMENT) {
    await fastify.register(AltairFastify, {
      path: '/altair',
      baseURL: '/altair/',
      endpointURL: '/graphql',
    });
  }
});
