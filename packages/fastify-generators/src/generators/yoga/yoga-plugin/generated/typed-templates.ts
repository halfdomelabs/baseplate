import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { configServiceImportsProvider } from '#src/generators/core/config-service/generated/ts-import-providers.js';
import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';
import { fastifyRedisImportsProvider } from '#src/generators/core/fastify-redis/generated/ts-import-providers.js';
import { loggerServiceImportsProvider } from '#src/generators/core/logger-service/generated/ts-import-providers.js';
import { requestServiceContextImportsProvider } from '#src/generators/core/request-service-context/generated/ts-import-providers.js';

const graphqlPlugin = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    requestServiceContextImports: requestServiceContextImportsProvider,
  },
  name: 'graphql-plugin',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/graphql/index.ts',
    ),
  },
  variables: {
    TPL_ENVELOP_PLUGINS: {},
    TPL_GRAPHQL_HANDLER: {},
    TPL_POST_SCHEMA_FRAGMENTS: {},
    TPL_SCHEMA: {},
    TPL_SIDE_EFFECT_IMPORTS: {},
  },
});

const pubsub = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'subscriptions',
  importMapProviders: { fastifyRedisImports: fastifyRedisImportsProvider },
  name: 'pubsub',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/graphql/pubsub.ts',
    ),
  },
  variables: { TPL_PUBLISH_ARGS: {} },
});

const websocket = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'subscriptions',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    requestServiceContextImports: requestServiceContextImportsProvider,
  },
  name: 'websocket',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/graphql/websocket.ts',
    ),
  },
  variables: { TPL_ON_CONNECT: {} },
});

export const subscriptionsGroup = { pubsub, websocket };

const useGraphLogger = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
  },
  name: 'use-graph-logger',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/graphql/use-graph-logger.ts',
    ),
  },
  variables: {},
});

export const YOGA_YOGA_PLUGIN_TEMPLATES = {
  graphqlPlugin,
  subscriptionsGroup,
  useGraphLogger,
};
