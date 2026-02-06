import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  errorHandlerServiceImportsProvider,
  prismaImportsProvider,
} from '@baseplate-dev/fastify-generators';
import path from 'node:path';

const rateLimiterService = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    prismaImports: prismaImportsProvider,
  },
  name: 'rate-limiter-service',
  projectExports: {
    createRateLimiter: { isTypeOnly: false },
    memoizeRateLimiter: { isTypeOnly: false },
  },
  referencedGeneratorTemplates: { rateLimiterTypes: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/services/rate-limiter.service.ts',
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
    RateLimiter: { isTypeOnly: true },
    RateLimiterConfig: { isTypeOnly: true },
    RateLimitResult: { isTypeOnly: true },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/types/rate-limiter.types.ts',
    ),
  },
  variables: {},
});

export const typesGroup = { rateLimiterTypes };

export const RATE_LIMIT_CORE_RATE_LIMIT_TEMPLATES = {
  rateLimiterService,
  typesGroup,
};
