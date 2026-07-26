// @ts-nocheck

import type { AppServices } from '%appRuntimeImports';
import type { ServiceContext } from '%serviceContextImports';
import type { FastifyReply, FastifyRequest } from 'fastify';

export interface RequestServiceContext extends ServiceContext {
  TPL_CONTEXT_FIELDS;
}

/**
 * A {@link RequestServiceContext} narrowed to only the named services,
 * mirroring {@link ServiceContextWith} for request-scoped code that wants an
 * honest signature. Structurally satisfied by the full context.
 */
export type RequestServiceContextWith<K extends keyof AppServices> = Omit<
  RequestServiceContext,
  'services'
> & { readonly services: Pick<AppServices, K> };

export function createContextFromRequest(
  request: FastifyRequest,
  services: AppServices,
  reply?: FastifyReply,
): RequestServiceContext {
  TPL_CONTEXT_BODY;

  return TPL_CONTEXT_CREATOR;
}
