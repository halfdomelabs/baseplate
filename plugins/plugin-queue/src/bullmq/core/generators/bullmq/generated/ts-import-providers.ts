import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import {
  queueServiceImportsProvider,
  queueServiceImportsSchema,
} from '#src/queue/providers/queue-service.provider.js';

import { BULLMQ_CORE_BULLMQ_PATHS } from './template-paths.js';

export const bullmqImportsSchema = createTsImportMapSchema({
  getScheduledJobs: {},
  initializeBullMQ: {},
  shutdownBullMQ: {},
});

export type BullmqImportsProvider = TsImportMapProviderFromSchema<
  typeof bullmqImportsSchema
>;

export const bullmqImportsProvider =
  createReadOnlyProviderType<BullmqImportsProvider>('bullmq-imports');

const bullmqCoreBullmqImportsTask = createGeneratorTask({
  dependencies: {
    paths: BULLMQ_CORE_BULLMQ_PATHS.provider,
  },
  exports: {
    bullmqImports: bullmqImportsProvider.export(packageScope),
    queueServiceImports: queueServiceImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        bullmqImports: createTsImportMap(bullmqImportsSchema, {
          getScheduledJobs: paths.bullmqService,
          initializeBullMQ: paths.bullmqService,
          shutdownBullMQ: paths.bullmqService,
        }),
        queueServiceImports: createTsImportMap(queueServiceImportsSchema, {
          createQueue: paths.bullmqService,
        }),
      },
    };
  },
});

export const BULLMQ_CORE_BULLMQ_IMPORTS = {
  task: bullmqCoreBullmqImportsTask,
};
