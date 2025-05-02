// @ts-nocheck

import { config } from '%configServiceImports';
import { HttpError } from '%errorHandlerServiceImports';
import { logger } from '%loggerServiceImports';
import { createContextFromRequest } from '%requestServiceContextImports';
import { requestContext } from '@fastify/request-context';
import { AltairFastify } from 'altair-fastify-plugin';
import { FastifyReply, FastifyRequest, RouteHandlerMethod } from 'fastify';
import fp from 'fastify-plugin';
import { GraphQLError } from 'graphql';
import { createYoga } from 'graphql-yoga';

TPL_SIDE_EFFECT_IMPORTS;

const IS_DEVELOPMENT = config.APP_ENVIRONMENT === 'development';

const schema = TPL_SCHEMA;

TPL_POST_SCHEMA_FRAGMENTS;

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
    plugins: TPL_ENVELOP_PLUGINS,
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

  TPL_GRAPHQL_HANDLER;

  if (IS_DEVELOPMENT) {
    await fastify.register(AltairFastify, {
      path: '/altair',
      baseURL: '/altair/',
      endpointURL: '/graphql',
    });
  }
});
