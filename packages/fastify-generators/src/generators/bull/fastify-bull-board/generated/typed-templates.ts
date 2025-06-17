import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';
import { fastifyRedisImportsProvider } from '#src/generators/core/fastify-redis/generated/ts-import-providers.js';
import { pothosImportsProvider } from '#src/generators/pothos/pothos/generated/ts-import-providers.js';

const index = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'module',
  importMapProviders: {},
  name: 'index',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/bull-board/index.ts',
    ),
  },
  variables: {},
});

const pluginsBullBoard = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'module',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
  },
  name: 'plugins-bull-board',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/bull-board/plugins/bull-board.ts',
    ),
  },
  variables: { TPL_QUEUES: {} },
});

const schemaAuthenticateMutations = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'module',
  importMapProviders: { pothosImports: pothosImportsProvider },
  name: 'schema-authenticate-mutations',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/bull-board/schema/authenticate.mutations.ts',
    ),
  },
  variables: {},
});

const servicesAuthService = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'module',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    fastifyRedisImports: fastifyRedisImportsProvider,
  },
  name: 'services-auth-service',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/bull-board/services/auth.service.ts',
    ),
  },
  variables: {},
});

export const moduleGroup = {
  index,
  pluginsBullBoard,
  schemaAuthenticateMutations,
  servicesAuthService,
};

export const BULL_FASTIFY_BULL_BOARD_TEMPLATES = { moduleGroup };
