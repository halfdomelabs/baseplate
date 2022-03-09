// @ts-nocheck

import path, { join } from 'path';
import AltairFastify from 'altair-fastify-plugin';
import fp from 'fastify-plugin';
import { GraphQLError, NoSchemaIntrospectionCustomRule } from 'graphql';
import mercurius from 'mercurius';
import { makeSchema } from 'nexus';
import { createContext } from './context';

const IS_DEVELOPMENT = CONFIG.APP_ENVIRONMENT === 'development';

const schema = makeSchema({
  types: ROOT_MODULE.schemaTypes,
  outputs: {
    typegen: join(__dirname, '../..', 'nexus-typegen.ts'),
    schema: join(__dirname, '../..', 'schema.graphql'),
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
    errorFormatter: (execution, context) => {
      function logAndAnnotateError(error: GraphQLError): GraphQLError {
        const { originalError } = error;
        if (originalError) {
          LOG_ERROR(originalError);
          if (originalError instanceof HTTP_ERROR)
            return new GraphQLError(error.message, {
              ...error,
              extensions: {
                code: originalError.code,
                statusCode: originalError.statusCode,
                extraData: originalError.extraData,
                reqId: context.reply.request.id,
              },
            });
        }
        LOG_ERROR(error);
        return new GraphQLError('Internal server error', {
          ...error,
          extensions: {
            code: 'INTERNAL_SERVER_ERROR',
            statusCode: 500,
            reqId: context.reply.request.id,
          },
        });
      }
      return {
        statusCode: 200,
        response: {
          ...execution,
          errors: execution.errors?.map(logAndAnnotateError),
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
