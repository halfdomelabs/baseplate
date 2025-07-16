// @ts-nocheck

import type { Queue } from 'bullmq';
import type { FastifyPluginAsync } from 'fastify';

import {
  authenticateBullBoardUser,
  BULL_BOARD_ACCESS_TOKEN_EXPIRY,
  validateBullBoardAccessToken,
} from '$servicesAuthService';
import {
  HttpError,
  logError,
  UnauthorizedError,
} from '%errorHandlerServiceImports';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { FastifyAdapter } from '@bull-board/fastify';

function getQueuesToTrack(): Queue[] {
  return TPL_QUEUES;
}

const ACCESS_TOKEN_COOKIE_NAME = 'bull-board-access-token';

export const bullBoardPlugin: FastifyPluginAsync = async (fastify) => {
  const serverAdapter = new FastifyAdapter();
  const queues = getQueuesToTrack();

  createBullBoard({
    queues: queues.map((queue) => new BullMQAdapter(queue)),
    serverAdapter,
  });

  serverAdapter.setErrorHandler((err) => {
    if (err instanceof HttpError) {
      // hack as type doesn't accept 401
      return {
        status: err.statusCode as 500,
        body: JSON.stringify({ message: err.message }),
      };
    }
    logError(err);
    return { status: 500, body: 'Internal server error' };
  });

  serverAdapter.setBasePath('/bull-board/ui');

  await fastify.register(serverAdapter.registerPlugin(), {
    basePath: '/bull-board/ui',
    prefix: '/bull-board/ui',
  });

  fastify.post<{ Body: { code: string } }>('/bull-board/auth', {
    schema: {
      body: {
        type: 'object',
        properties: { code: { type: 'string' } },
      },
    },
    handler: async (req, reply) => {
      const authCode = req.body.code;
      const accessToken = await authenticateBullBoardUser(authCode);

      reply
        .setCookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          path: '/bull-board',
          maxAge: BULL_BOARD_ACCESS_TOKEN_EXPIRY,
        })
        .redirect('ui');
    },
  });

  fastify.addHook('preHandler', async (request) => {
    if (request.url.startsWith('/bull-board/auth')) {
      return;
    }

    const accessToken = request.cookies[ACCESS_TOKEN_COOKIE_NAME];

    if (typeof accessToken !== 'string') {
      throw new UnauthorizedError('Invalid access token');
    }

    await validateBullBoardAccessToken(accessToken);
  });
};
