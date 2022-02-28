// @ts-nocheck

import { FastifyRequest } from 'fastify';

export interface GraphQLContext {
  CONTEXT_FIELDS;
}

export function createContext(request: FastifyRequest): GraphQLContext {
  return CONTEXT_CREATOR;
}
