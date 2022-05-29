// @ts-nocheck

import { FastifyRequest, FastifyReply } from 'fastify';

export interface ServiceContext {
  CONTEXT_FIELDS;
}

export function createContextFromRequest(
  request: FastifyRequest,
  reply: FastifyReply
): ServiceContext {
  return CONTEXT_CREATOR;
}
