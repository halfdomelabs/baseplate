import { requestContext } from '@fastify/request-context';
import { pino } from 'pino';

export const logger = pino({
  formatters: {
    level(level) {
      return { level };
    },
  },
  mixin() {
    return { reqId: requestContext.get('reqInfo')?.id };
  },
});
