// @ts-nocheck

import {
  ManagedRepeatableJobsConfig,
  synchronizeRepeatableJobs,
} from '@src/services/bull.js';
import { logError } from '%error-logger';

const REPEAT_JOB_CONFIGS: ManagedRepeatableJobsConfig[] = REPEAT_JOBS;

synchronizeRepeatableJobs(REPEAT_JOB_CONFIGS).catch((err) => {
  logError(err);
  process.exit(1);
});
