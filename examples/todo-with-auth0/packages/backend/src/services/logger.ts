import { requestContext } from '@fastify/request-context';
import { pino } from 'pino';

export const logger = pino(
  /* TPL_LOGGER_OPTIONS:START */ {
    formatters: {
      level(level) {
        return { level };
      },
    },
    mixin() {
      return {
        reqId: requestContext.get('reqInfo')?.id,
        userId: requestContext.get('userId'),
      };
    },
  } /* TPL_LOGGER_OPTIONS:END */,
);
