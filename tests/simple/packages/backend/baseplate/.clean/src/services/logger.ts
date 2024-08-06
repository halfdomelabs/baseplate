import { requestContext } from '@fastify/request-context';
import Pino from 'pino';

export const logger = Pino({
  formatters: {
    level(level) {
      return { level };
    },
  },
  mixin() {
    return { reqId: requestContext.get('reqInfo')?.id };
  },
});
