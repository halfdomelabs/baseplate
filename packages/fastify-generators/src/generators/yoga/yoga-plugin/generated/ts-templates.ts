import {
  createTsTemplateFile,
  createTsTemplateGroup,
} from '@baseplate-dev/core-generators';

import { configServiceImportsProvider } from '../../../core/config-service/generated/ts-import-providers.js';
import { errorHandlerServiceImportsProvider } from '../../../core/error-handler-service/generated/ts-import-maps.js';
import { fastifyRedisImportsProvider } from '../../../core/fastify-redis/generated/ts-import-maps.js';
import { loggerServiceImportsProvider } from '../../../core/logger-service/generated/ts-import-maps.js';
import { requestServiceContextImportsProvider } from '../../../core/request-service-context/generated/ts-import-maps.js';

const graphqlPlugin = createTsTemplateFile({
  importMapProviders: {
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    requestServiceContextImports: requestServiceContextImportsProvider,
  },
  name: 'graphql-plugin',
  projectExports: {},
  source: { path: 'graphql-plugin.ts' },
  variables: {
    TPL_ENVELOP_PLUGINS: {},
    TPL_GRAPHQL_HANDLER: {},
    TPL_POST_SCHEMA_FRAGMENTS: {},
    TPL_SCHEMA: {},
    TPL_SIDE_EFFECT_IMPORTS: {},
  },
});

const pubsub = createTsTemplateFile({
  group: 'subscriptions',
  importMapProviders: { fastifyRedisImports: fastifyRedisImportsProvider },
  name: 'pubsub',
  projectExports: {},
  source: { path: 'pubsub.ts' },
  variables: { TPL_PUBLISH_ARGS: {} },
});

const websocket = createTsTemplateFile({
  group: 'subscriptions',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    requestServiceContextImports: requestServiceContextImportsProvider,
  },
  name: 'websocket',
  projectExports: {},
  source: { path: 'websocket.ts' },
  variables: { TPL_ON_CONNECT: {} },
});

const subscriptionsGroup = createTsTemplateGroup({
  templates: {
    pubsub: { destination: 'pubsub.ts', template: pubsub },
    websocket: { destination: 'websocket.ts', template: websocket },
  },
});

const useGraphLogger = createTsTemplateFile({
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
  },
  name: 'use-graph-logger',
  projectExports: {},
  source: { path: 'use-graph-logger.ts' },
  variables: {},
});

export const YOGA_YOGA_PLUGIN_TS_TEMPLATES = {
  graphqlPlugin,
  subscriptionsGroup,
  useGraphLogger,
};
