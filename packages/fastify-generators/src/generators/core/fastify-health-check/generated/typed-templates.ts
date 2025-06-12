import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const healthCheck = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  importMapProviders: {},
  name: 'health-check',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/health-check.ts',
    ),
  },
  variables: { TPL_HEALTH_CHECKS: {} },
});

export const CORE_FASTIFY_HEALTH_CHECK_TEMPLATES = { healthCheck };
