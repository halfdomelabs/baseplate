// @ts-nocheck

import type { AppRuntime } from '%appRuntimeImports';
import type { ServiceContext } from '%serviceContextImports';
import type { FastifyReply, FastifyRequest } from 'fastify';

export interface RequestServiceContext extends ServiceContext {
  TPL_CONTEXT_FIELDS;
}

export function createContextFromRequest(
  request: FastifyRequest,
  runtime: AppRuntime,
  reply?: FastifyReply,
): RequestServiceContext {
  TPL_CONTEXT_BODY;

  return TPL_CONTEXT_CREATOR;
}
