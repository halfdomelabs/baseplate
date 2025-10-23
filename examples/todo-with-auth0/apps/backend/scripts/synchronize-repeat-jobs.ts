#!/usr/bin/env node

import type { ManagedRepeatableJobsConfig } from '@src/services/bull/index.js';

import { synchronizeRepeatableJobs } from '@src/services/bull/index.js';
import { logError } from '@src/services/error-logger.js';

const REPEAT_JOB_CONFIGS: ManagedRepeatableJobsConfig[] =
  /* TPL_REPEAT_JOBS:START */ []; /* TPL_REPEAT_JOBS:END */

synchronizeRepeatableJobs(REPEAT_JOB_CONFIGS).catch((err: unknown) => {
  logError(err);
  process.exit(1);
});
