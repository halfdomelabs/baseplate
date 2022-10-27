// @ts-nocheck

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import { Queue } from 'bullmq';
import { FastifyPluginAsync } from 'fastify';
import { logError } from '%error-logger';
import { HttpError, UnauthorizedError } from '%http-errors';
import {
  authenticateBullBoardUser,
  BULL_BOARD_ACCESS_TOKEN_EXPIRY,
  validateBullBoardAccessToken,
} from '../services/auth.service';

// https://github.com/fastify/fastify/issues/1864
/* eslint-disable @typescript-eslint/no-floating-promises */

function getQueuesToTrack(): Queue[] {
  return QUEUES_TO_TRACK;
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

  fastify.addHook('preHandler', async (request, reply) => {
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
