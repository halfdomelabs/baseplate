import type { TRPCMutationProcedure, TRPCQueryProcedure } from '@trpc/server';
import type { ProcedureBuilder } from '@trpc/server/unstable-core-do-not-import';
import type z from 'zod';

import type { ServiceAction, ServiceActionContext } from '../types.js';

import { runActionInWorker } from './run-in-worker.js';

export interface TrpcFromActionBuilder {
  mutation: <TInputType extends z.ZodType, TOutputType extends z.ZodType>(
    action: ServiceAction<TInputType, TOutputType>,
  ) => TRPCMutationProcedure<{
    meta: unknown;
    input: z.input<TInputType>;
    output: z.output<TOutputType>;
  }>;

  query: <TInputType extends z.ZodType, TOutputType extends z.ZodType>(
    action: ServiceAction<TInputType, TOutputType>,
  ) => TRPCQueryProcedure<{
    meta: unknown;
    input: z.input<TInputType>;
    output: z.input<TOutputType>;
  }>;
}

export function makeTrpcFromActionBuilder<Ctx extends ServiceActionContext>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  baseProcedure: ProcedureBuilder<Ctx, any, any, any, any, any, any, false>,
): TrpcFromActionBuilder {
  return {
    mutation: <TInputType extends z.ZodType, TOutputType extends z.ZodType>(
      action: ServiceAction<TInputType, TOutputType>,
    ) =>
      baseProcedure
        .input(action.inputSchema)
        .output(action.outputSchema)
        // The types of TRPC are quite complex and we need to cast to never to avoid type errors
        .mutation(
          ({ input, ctx }) =>
            runActionInWorker(
              action,
              input as unknown as z.output<TInputType>,
              ctx,
            ) as never,
        ) as TRPCMutationProcedure<{
        meta: unknown;
        input: z.input<TInputType>;
        output: z.output<TOutputType>;
      }>,
    query: <TInputType extends z.ZodType, TOutputType extends z.ZodType>(
      action: ServiceAction<TInputType, TOutputType>,
    ) =>
      baseProcedure
        .input(action.inputSchema)
        .output(action.outputSchema)
        // The types of TRPC are quite complex and we need to cast to never to avoid type errors
        .query(
          ({ input, ctx }) =>
            runActionInWorker(
              action,
              input as unknown as z.output<TInputType>,
              ctx,
            ) as never,
        ) as TRPCQueryProcedure<{
        meta: unknown;
        input: z.input<TInputType>;
        output: z.input<TOutputType>;
      }>,
  };
}
