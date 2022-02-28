// @ts-nocheck

import path, { join } from 'path';
import AltairFastify from 'altair-fastify-plugin';
import fp from 'fastify-plugin';
import { NoSchemaIntrospectionCustomRule } from 'graphql';
import mercurius from 'mercurius';
import { makeSchema } from 'nexus';
import { createContext } from './context';

const IS_DEVELOPMENT = CONFIG.APP_ENVIRONMENT === 'development';

const schema = makeSchema({
  types: ROOT_MODULE.types,
  outputs: {
    typegen: join(__dirname, '../..', 'nexus-typegen.ts'),
    schema: join(__dirname, '../..', 'schema.graphql'),
  },
  plugins: PLUGINS,
  contextType: {
    module: path.join(__dirname, 'context.ts'),
    export: 'GraphQLContext',
  },
});

export const graphqlPlugin = fp(async (fastify) => {
  await fastify.register(mercurius, {
    graphiql: false,
    ide: false,
    path: '/graphql',
    schema,
    validationRules: IS_DEVELOPMENT ? [] : [NoSchemaIntrospectionCustomRule],
    context: createContext,
  });

  if (IS_DEVELOPMENT) {
    await fastify.register(AltairFastify, {
      path: '/altair',
      baseURL: '/altair/',
      endpointURL: '/graphql',
    });
  }
});
