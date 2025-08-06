import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import {
  configServiceImportsProvider,
  errorHandlerServiceImportsProvider,
  loggerServiceImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { queuesImportsProvider } from '#src/queue/core/generators/queues/generated/ts-import-providers.js';

import { PG_BOSS_CORE_PG_BOSS_PATHS } from './template-paths.js';
import { PG_BOSS_CORE_PG_BOSS_TEMPLATES } from './typed-templates.js';

export interface PgBossCorePgBossRenderers {
  mainGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof PG_BOSS_CORE_PG_BOSS_TEMPLATES.mainGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const pgBossCorePgBossRenderers = createProviderType<PgBossCorePgBossRenderers>(
  'pg-boss-core-pg-boss-renderers',
);

const pgBossCorePgBossRenderersTask = createGeneratorTask({
  dependencies: {
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    paths: PG_BOSS_CORE_PG_BOSS_PATHS.provider,
    queuesImports: queuesImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { pgBossCorePgBossRenderers: pgBossCorePgBossRenderers.export() },
  run({
    configServiceImports,
    errorHandlerServiceImports,
    loggerServiceImports,
    paths,
    queuesImports,
    typescriptFile,
  }) {
    return {
      providers: {
        pgBossCorePgBossRenderers: {
          mainGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: PG_BOSS_CORE_PG_BOSS_TEMPLATES.mainGroup,
                paths,
                importMapProviders: {
                  configServiceImports,
                  errorHandlerServiceImports,
                  loggerServiceImports,
                  queuesImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const PG_BOSS_CORE_PG_BOSS_RENDERERS = {
  provider: pgBossCorePgBossRenderers,
  task: pgBossCorePgBossRenderersTask,
};
