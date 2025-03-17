import type { TRPC_ERROR_CODE_KEY } from '@trpc/server/rpc';

import { TRPCError } from '@trpc/server';

/**
 * Error thrown that will be displayed to the user directly.
 */
export class UserVisibleError extends TRPCError {
  constructor(
    message: string,
    public descriptionText?: string,
    code: TRPC_ERROR_CODE_KEY = 'INTERNAL_SERVER_ERROR',
  ) {
    super({
      message,
      code,
    });
  }
}
