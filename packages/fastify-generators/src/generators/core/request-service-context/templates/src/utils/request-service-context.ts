// @ts-nocheck

import type { AppServices } from '%appRuntimeImports';
import type { ServiceContext } from '%serviceContextImports';
import type { FastifyReply, FastifyRequest } from 'fastify';

export interface RequestServiceContext extends ServiceContext {
  TPL_CONTEXT_FIELDS;
}

/**
 * {@link ServiceContextWith}'s request-scoped mirror, keeping cookieStore and
 * reqInfo.
 */
export type RequestServiceContextWith<K extends keyof AppServices> = Omit<
  RequestServiceContext,
  'services'
> & { readonly services: Pick<AppServices, K> };

/** Mints the per-request context, carrying the public services only. */
export function createContextFromRequest(
  request: FastifyRequest,
  services: AppServices,
  reply?: FastifyReply,
): RequestServiceContext {
  TPL_CONTEXT_BODY;

  return TPL_CONTEXT_CREATOR;
}
