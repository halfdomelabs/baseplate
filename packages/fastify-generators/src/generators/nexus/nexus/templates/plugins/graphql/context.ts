// @ts-nocheck

import { FastifyRequest, FastifyReply } from 'fastify';

export interface GraphQLContext {
  CONTEXT_FIELDS;
}

export function createContext(
  request: FastifyRequest,
  reply: FastifyReply
): GraphQLContext {
  return CONTEXT_CREATOR;
}
