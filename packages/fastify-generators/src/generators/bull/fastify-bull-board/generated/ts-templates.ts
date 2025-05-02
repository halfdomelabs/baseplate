import {
  createTsTemplateFile,
  createTsTemplateGroup,
} from '@halfdomelabs/core-generators';

import { errorHandlerServiceImportsProvider } from '../../../core/error-handler-service/generated/ts-import-maps.js';
import { fastifyRedisImportsProvider } from '../../../core/fastify-redis/generated/ts-import-maps.js';
import { pothosImportsProvider } from '../../../pothos/pothos/generated/ts-import-maps.js';

const index = createTsTemplateFile({
  group: 'module',
  name: 'index',
  projectExports: {},
  source: { path: 'index.ts' },
  variables: {},
});

const pluginsBullBoard = createTsTemplateFile({
  group: 'module',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
  },
  name: 'plugins-bull-board',
  projectExports: {},
  source: { path: 'plugins/bull-board.ts' },
  variables: { TPL_QUEUES: {} },
});

const schemaAuthenticateMutations = createTsTemplateFile({
  group: 'module',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'schema-authenticate-mutations',
  projectExports: {},
  source: { path: 'schema/authenticate.mutations.ts' },
  variables: {},
});

const servicesAuthService = createTsTemplateFile({
  group: 'module',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    fastifyRedisImports: fastifyRedisImportsProvider,
  },
  name: 'services-auth-service',
  projectExports: {},
  source: { path: 'services/auth.service.ts' },
  variables: {},
});

const moduleGroup = createTsTemplateGroup({
  templates: {
    index: { destination: 'index.ts', template: index },
    pluginsBullBoard: {
      destination: 'plugins/bull-board.ts',
      template: pluginsBullBoard,
    },
    schemaAuthenticateMutations: {
      destination: 'schema/authenticate.mutations.ts',
      template: schemaAuthenticateMutations,
    },
    servicesAuthService: {
      destination: 'services/auth.service.ts',
      template: servicesAuthService,
    },
  },
});

export const BULL_FASTIFY_BULL_BOARD_TS_TEMPLATES = { moduleGroup };
