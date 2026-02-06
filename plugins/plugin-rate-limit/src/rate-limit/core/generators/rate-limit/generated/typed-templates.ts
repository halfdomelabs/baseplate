import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  errorHandlerServiceImportsProvider,
  prismaImportsProvider,
} from '@baseplate-dev/fastify-generators';
import path from 'node:path';

import { rateLimitImportsProvider } from '#src/rate-limit/core/generators/rate-limit/generated/ts-import-providers.js';

const rateLimiterService = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    prismaImports: prismaImportsProvider,
    rateLimitImports: rateLimitImportsProvider,
  },
  name: 'rate-limiter-service',
  projectExports: { createRateLimiter: {}, memoizeRateLimiter: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/rate-limiter.service.ts',
    ),
  },
  variables: {},
});

const rateLimiterTypes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'types',
  importMapProviders: {},
  name: 'rate-limiter-types',
  projectExports: {
    RateLimiterConfig: {},
    RateLimitResult: {},
    RateLimiter: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/types/rate-limiter.types.ts',
    ),
  },
  variables: {},
});

export const typesGroup = { rateLimiterTypes };

export const RATE_LIMIT_CORE_RATE_LIMIT_TEMPLATES = {
  rateLimiterService,
  typesGroup,
};
