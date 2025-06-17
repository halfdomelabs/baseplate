import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  projectScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { BULL_BULL_MQ_PATHS } from './template-paths.js';

const bullMqImportsSchema = createTsImportMapSchema({
  createWorker: {},
  getOrCreateManagedQueue: {},
  ManagedRepeatableJobConfig: { isTypeOnly: true },
  ManagedRepeatableJobsConfig: { isTypeOnly: true },
  synchronizeRepeatableJobs: {},
});

export type BullMqImportsProvider = TsImportMapProviderFromSchema<
  typeof bullMqImportsSchema
>;

export const bullMqImportsProvider =
  createReadOnlyProviderType<BullMqImportsProvider>('bull-mq-imports');

const bullBullMqImportsTask = createGeneratorTask({
  dependencies: {
    paths: BULL_BULL_MQ_PATHS.provider,
  },
  exports: { bullMqImports: bullMqImportsProvider.export(projectScope) },
  run({ paths }) {
    return {
      providers: {
        bullMqImports: createTsImportMap(bullMqImportsSchema, {
          createWorker: paths.serviceIndex,
          getOrCreateManagedQueue: paths.serviceIndex,
          ManagedRepeatableJobConfig: paths.serviceIndex,
          ManagedRepeatableJobsConfig: paths.serviceIndex,
          synchronizeRepeatableJobs: paths.serviceIndex,
        }),
      },
    };
  },
});

export const BULL_BULL_MQ_IMPORTS = {
  task: bullBullMqImportsTask,
};
