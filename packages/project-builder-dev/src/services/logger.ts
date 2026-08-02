import type { LoggerOptions } from 'pino';

import { pino } from 'pino';

const DEFAULT_LOGGER_OPTIONS: LoggerOptions = {
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  },
};

export const logger = pino(DEFAULT_LOGGER_OPTIONS);
