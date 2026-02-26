#!/usr/bin/env node

import { runDevCli } from './index.js';
import { logger } from './services/logger.js';

try {
  await runDevCli();
} catch (err) {
  logger.error(err);
  process.exit(1);
}
