// @ts-nocheck

import path, { join } from 'path';
import AltairFastify from 'altair-fastify-plugin';
import fp from 'fastify-plugin';
import { GraphQLError, NoSchemaIntrospectionCustomRule } from 'graphql';
import mercurius from 'mercurius';
import { makeSchema } from 'nexus';
import { createContext } from './context';
import { config } from '%config';
import { logError } from '%error-logger';
import { HttpError } from '%http-errors';

const IS_DEVELOPMENT = config.APP_ENVIRONMENT === 'development';

const schema = makeSchema({
  types: ROOT_MODULE.schemaTypes,
  outputs: {
    typegen: join(__dirname, '../..', 'nexus-typegen.ts'),
    schema: join(__dirname, '../../..', 'schema.graphql'),
  },
  plugins: PLUGINS,
  contextType: {
    module: path.join(__dirname, 'context.ts'),
    export: 'GraphQLContext',
  },
  shouldExitAfterGenerateArtifacts: process.argv.includes('--nexus-exit'),
});

export const graphqlPlugin = fp(async (fastify) => {
  await fastify.register(mercurius, {
    graphiql: false,
    ide: false,
    path: '/graphql',
    schema,
    validationRules: IS_DEVELOPMENT ? [] : [NoSchemaIntrospectionCustomRule],
    context: createContext,
    errorFormatter: (result, context) => {
      // if hooks throw an error, pass through without formatting to default error handler
      if (!result?.errors) {
        return {
          statusCode: 500,
          response: result,
        };
      }
      function logAndAnnotateError(error: GraphQLError): GraphQLError {
        const { originalError } = error;
        if (originalError) {
          logError(originalError);
          if (originalError instanceof HttpError)
            return new GraphQLError(error.message, {
              ...error,
              extensions: {
                code: originalError.code,
                statusCode: originalError.statusCode,
                extraData: originalError.extraData,
                reqId: context.reply.request.id,
              },
            });
          // Rewrite error message to hide sensitive details outside of development
          const errorMessage = IS_DEVELOPMENT
            ? error.message
            : 'Internal server error';
          return new GraphQLError(errorMessage, {
            ...error,
            extensions: {
              code: 'INTERNAL_SERVER_ERROR',
              statusCode: 500,
              reqId: context.reply.request.id,
            },
          });
        }
        // if it's a parser error, return direct
        return error;
      }
      return {
        statusCode: 200,
        response: {
          ...result,
          errors: result.errors?.map(logAndAnnotateError),
        },
      };
    },
  });

  if (IS_DEVELOPMENT) {
    await fastify.register(AltairFastify, {
      path: '/altair',
      baseURL: '/altair/',
      endpointURL: '/graphql',
    });
  }
});
