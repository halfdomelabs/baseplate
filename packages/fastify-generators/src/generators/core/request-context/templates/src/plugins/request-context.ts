// @ts-nocheck

import type { FastifyRequest } from 'fastify';

import {
  fastifyRequestContext,
  requestContext,
} from '@fastify/request-context';
import fp from 'fastify-plugin';

export interface RequestInfo {
  id: string;
  url: string;
  method: string;
  headers: FastifyRequest['headers'];
  ip: string;
}

declare module '@fastify/request-context' {
  interface RequestContextData {
    reqInfo: RequestInfo;
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    reqInfo: RequestInfo;
    TPL_FASTIFY_REQUEST_AUGMENTATIONS;
  }
}

export const requestContextPlugin = fp(async (fastify) => {
  await fastify.register(fastifyRequestContext);

  fastify.decorateRequest('reqInfo');
  TPL_DECORATOR_REGISTRATIONS;

  fastify.addHook('onRequest', (req, _reply, done) => {
    const reqInfo = {
      id: req.id,
      url: req.url,
      method: req.method,
      headers: req.headers,
      ip: req.ip,
    };

    requestContext.set('reqInfo', reqInfo);
    req.reqInfo = reqInfo;

    done();
  });

  TPL_EXTRA_HOOKS;
});
