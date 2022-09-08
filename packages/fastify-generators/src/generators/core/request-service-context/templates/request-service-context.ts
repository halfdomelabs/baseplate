//@ts-nocheck

import { FastifyReply, FastifyRequest } from 'fastify';
import { ServiceContext, createServiceContext } from '%service-context';

export interface RequestServiceContext extends ServiceContext {
  CONTEXT_FIELDS;
}

export function createContextFromRequest(
  request: FastifyRequest,
  reply?: FastifyReply
): RequestServiceContext {
  CONTEXT_BODY;

  return CONTEXT_CREATOR;
}
