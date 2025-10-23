import type { CookieSerializeOptions } from '@fastify/cookie';
import type { FastifyReply, FastifyRequest } from 'fastify';

import type { RequestInfo } from '../plugins/request-context.js';
import type { ServiceContext } from './service-context.js';

import { createServiceContext } from './service-context.js';

/* HOISTED:cookie-store-interface:START */

interface CookieStore {
  get(name: string): string | undefined;
  set(name: string, value: string, options?: CookieSerializeOptions): void;
  clear(name: string, options?: CookieSerializeOptions): void;
}
/* HOISTED:cookie-store-interface:END */

export interface RequestServiceContext extends ServiceContext {
  /* TPL_CONTEXT_FIELDS:START */
  cookieStore: CookieStore;
  reqInfo: RequestInfo;
  /* TPL_CONTEXT_FIELDS:END */
}

export function createContextFromRequest(
  request: FastifyRequest,
  reply?: FastifyReply,
): RequestServiceContext {
  /* TPL_CONTEXT_BODY:START */
  function getReply(): FastifyReply {
    if (!reply) {
      throw new Error(
        'Reply is not defined. This may happen if calling this function from a websocket connection.',
      );
    }
    return reply;
  }

  /* TPL_CONTEXT_BODY:END */

  return /* TPL_CONTEXT_CREATOR:START */ {
    ...createServiceContext({ auth: request.auth }),
    cookieStore: {
      get: (name) => request.cookies[name],
      set: (name, value, options) =>
        void getReply().setCookie(name, value, options),
      clear: (name, options) => void getReply().clearCookie(name, options),
    },
    reqInfo: request.reqInfo,
  } /* TPL_CONTEXT_CREATOR:END */;
}
