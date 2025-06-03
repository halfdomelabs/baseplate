#!/usr/bin/env node

import { runCli } from './index.js';
import { logger } from './services/logger.js';

try {
  await runCli();
} catch (err) {
  logger.error(err);
  process.exit(1);
}
