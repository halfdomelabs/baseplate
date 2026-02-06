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

import { RATE_LIMIT_CORE_RATE_LIMIT_PATHS } from './template-paths.js';

export const rateLimitImportsSchema = createTsImportMapSchema({
  createRateLimiter: {},
  memoizeRateLimiter: {},
  RateLimiter: { isTypeOnly: true },
  RateLimiterConfig: { isTypeOnly: true },
  RateLimitResult: { isTypeOnly: true },
});

export type RateLimitImportsProvider = TsImportMapProviderFromSchema<
  typeof rateLimitImportsSchema
>;

export const rateLimitImportsProvider =
  createReadOnlyProviderType<RateLimitImportsProvider>('rate-limit-imports');

const rateLimitCoreRateLimitImportsTask = createGeneratorTask({
  dependencies: {
    paths: RATE_LIMIT_CORE_RATE_LIMIT_PATHS.provider,
  },
  exports: { rateLimitImports: rateLimitImportsProvider.export(packageScope) },
  run({ paths }) {
    return {
      providers: {
        rateLimitImports: createTsImportMap(rateLimitImportsSchema, {
          createRateLimiter: paths.rateLimiterService,
          memoizeRateLimiter: paths.rateLimiterService,
          RateLimiter: paths.rateLimiterTypes,
          RateLimiterConfig: paths.rateLimiterTypes,
          RateLimitResult: paths.rateLimiterTypes,
        }),
      },
    };
  },
});

export const RATE_LIMIT_CORE_RATE_LIMIT_IMPORTS = {
  task: rateLimitCoreRateLimitImportsTask,
};
