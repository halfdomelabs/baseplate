import type { FastifyRequest } from 'fastify';

import {
  fastifyRequestContext,
  requestContext,
} from '@fastify/request-context';
import fp from 'fastify-plugin';

import type { AppRuntime } from '../utils/app-runtime.js';
import type { RequestServiceContext } from '../utils/request-service-context.js';

import { createContextFromRequest } from '../utils/request-service-context.js';

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
    /* TPL_FASTIFY_REQUEST_AUGMENTATIONS:START */
    serviceContext: RequestServiceContext;
    /* TPL_FASTIFY_REQUEST_AUGMENTATIONS:END */
  }
}

export const requestContextPlugin = fp<{ runtime: AppRuntime }>(
  async (fastify, opts) => {
    await fastify.register(fastifyRequestContext);

    fastify.decorateRequest('reqInfo');
    /* TPL_DECORATOR_REGISTRATIONS:START */
    fastify.decorateRequest('serviceContext');
    /* TPL_DECORATOR_REGISTRATIONS:END */

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

    /* TPL_EXTRA_HOOKS:START */
    fastify.addHook('preHandler', (req, reply, done) => {
      req.serviceContext = createContextFromRequest(req, opts.runtime, reply);
      done();
    });
    /* TPL_EXTRA_HOOKS:END */
  },
);
