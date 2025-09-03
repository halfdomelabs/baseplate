import { initTRPC } from '@trpc/server';

import type { ServiceActionContext } from '#src/actions/index.js';

import { makeTrpcFromActionBuilder } from '#src/actions/index.js';
import { UserVisibleError } from '#src/utils/errors.js';

const t = initTRPC.context<ServiceActionContext>().create({
  errorFormatter({ error, shape }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        isUserVisible: error instanceof UserVisibleError,
        descriptionText:
          error instanceof UserVisibleError ? error.descriptionText : undefined,
      },
    };
  },
});

export const { router: devRouter } = t;

export const devTrpcActionBuilder = makeTrpcFromActionBuilder(t.procedure);
