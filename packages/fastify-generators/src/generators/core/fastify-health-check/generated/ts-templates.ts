import { createTsTemplateFile } from '@baseplate-dev/core-generators';

const healthCheck = createTsTemplateFile({
  name: 'health-check',
  projectExports: {},
  source: { path: 'health-check.ts' },
  variables: { TPL_HEALTH_CHECKS: {} },
});

export const CORE_FASTIFY_HEALTH_CHECK_TS_TEMPLATES = { healthCheck };
