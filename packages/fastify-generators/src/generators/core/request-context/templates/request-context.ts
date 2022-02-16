// @ts-nocheck
import { FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import {
  requestContext,
  fastifyRequestContextPlugin,
} from 'fastify-request-context';

export interface RequestInfo {
  id: string;
  url: string;
  method: string;
  headers: FastifyRequest['headers'];
  ip: string;
}

declare module 'fastify-request-context' {
  interface RequestContextData {
    reqInfo: RequestInfo;
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    reqInfo: RequestInfo;
  }
}

export const requestContextPlugin = fp(async (fastify) => {
  await fastify.register(fastifyRequestContextPlugin);

  fastify.decorateRequest('reqInfo', null);

  fastify.addHook('onRequest', async (req) => {
    const reqInfo = {
      id: req.id as string,
      url: req.url,
      method: req.method,
      headers: req.headers,
      ip: req.ip,
    };

    requestContext.set('reqInfo', reqInfo);
    req.reqInfo = reqInfo;
  });
});
