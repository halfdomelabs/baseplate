#!/usr/bin/env node
// @ts-nocheck

import type { ManagedRepeatableJobsConfig } from '$serviceIndex';

import { synchronizeRepeatableJobs } from '$serviceIndex';
import { logError } from '%errorHandlerServiceImports';

const REPEAT_JOB_CONFIGS: ManagedRepeatableJobsConfig[] = TPL_REPEAT_JOBS;

synchronizeRepeatableJobs(REPEAT_JOB_CONFIGS).catch((err: unknown) => {
  logError(err);
  process.exit(1);
});
