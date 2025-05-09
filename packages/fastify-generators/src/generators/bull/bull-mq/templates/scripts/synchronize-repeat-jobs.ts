#!/usr/bin/env node
// @ts-nocheck

import { logError } from '%errorHandlerServiceImports';

import type { ManagedRepeatableJobsConfig } from '../src/services/bull/index.js';

import { synchronizeRepeatableJobs } from '../src/services/bull/index.js';

const REPEAT_JOB_CONFIGS: ManagedRepeatableJobsConfig[] = TPL_REPEAT_JOBS;

synchronizeRepeatableJobs(REPEAT_JOB_CONFIGS).catch((err: unknown) => {
  logError(err);
  process.exit(1);
});
