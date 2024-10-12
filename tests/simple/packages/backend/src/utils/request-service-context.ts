import { CookieSerializeOptions } from '@fastify/cookie';
import { FastifyReply, FastifyRequest } from 'fastify';
import type { RequestInfo } from '../plugins/request-context.js';
import { ServiceContext, createServiceContext } from './service-context.js';

interface CookieStore {
  get(name: string): string | undefined;
  set(name: string, value: string, options?: CookieSerializeOptions): void;
  clear(name: string): void;
}

export interface RequestServiceContext extends ServiceContext {
  reqInfo: RequestInfo;
  cookieStore: CookieStore;
}

export function createContextFromRequest(
  request: FastifyRequest,
  reply?: FastifyReply,
): RequestServiceContext {
  function getReply(): FastifyReply {
    if (!reply) {
      throw new Error(
        'Reply is not defined. This may happen if calling this function from a websocket connection.',
      );
    }
    return reply;
  }

  return {
    ...createServiceContext(),
    reqInfo: request.reqInfo,
    cookieStore: {
      get: (name) => request.cookies[name],
      set: (name, value, options) =>
        void getReply().setCookie(name, value, options),
      clear: (name) => void getReply().clearCookie(name),
    },
  };
}
