// @ts-nocheck

import type { ServiceContext } from '%serviceContextImports';

import { FastifyReply, FastifyRequest } from 'fastify';

export interface RequestServiceContext extends ServiceContext {
  TPL_CONTEXT_FIELDS;
}

export function createContextFromRequest(
  request: FastifyRequest,
  reply?: FastifyReply,
): RequestServiceContext {
  TPL_CONTEXT_BODY;

  return TPL_CONTEXT_CREATOR;
}
