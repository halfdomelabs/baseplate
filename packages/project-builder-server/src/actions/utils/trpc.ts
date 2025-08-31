import type { TRPCMutationProcedure, TRPCQueryProcedure } from '@trpc/server';
import type { ProcedureBuilder } from '@trpc/server/unstable-core-do-not-import';

import z from 'zod';

import type { ServiceAction, ServiceActionContext } from '../types.js';

import { runActionInWorker } from './run-in-worker.js';

export interface TrpcFromActionBuilder {
  mutation: <
    TInputShape extends z.ZodRawShape,
    TOutputShape extends z.ZodRawShape,
  >(
    action: ServiceAction<TInputShape, TOutputShape>,
  ) => TRPCMutationProcedure<{
    input: z.objectOutputType<TInputShape, z.ZodTypeAny>;
    output: z.objectOutputType<TOutputShape, z.ZodTypeAny>;
  }>;

  query: <
    TInputShape extends z.ZodRawShape,
    TOutputShape extends z.ZodRawShape,
  >(
    action: ServiceAction<TInputShape, TOutputShape>,
  ) => TRPCQueryProcedure<{
    input: z.objectOutputType<TInputShape, z.ZodTypeAny, 'strip'>;
    output: z.objectOutputType<TOutputShape, z.ZodTypeAny, 'strip'>;
  }>;
}

export function makeTrpcFromActionBuilder<Ctx extends ServiceActionContext>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  baseProcedure: ProcedureBuilder<Ctx, any, any, any, any, any, any, false>,
): TrpcFromActionBuilder {
  return {
    mutation: <
      TInputShape extends z.ZodRawShape,
      TOutputShape extends z.ZodRawShape,
    >(
      action: ServiceAction<TInputShape, TOutputShape>,
    ) =>
      baseProcedure
        .input(z.object(action.inputSchema) as z.AnyZodObject)
        .output(z.object(action.outputSchema) as z.AnyZodObject)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        .mutation(({ input, ctx }) => runActionInWorker(action, input, ctx)),
    query: <
      TInputShape extends z.ZodRawShape,
      TOutputShape extends z.ZodRawShape,
    >(
      action: ServiceAction<TInputShape, TOutputShape>,
    ) =>
      baseProcedure
        .input(z.object(action.inputSchema) as z.AnyZodObject)
        .output(z.object(action.outputSchema) as z.AnyZodObject)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        .query(({ input, ctx }) => runActionInWorker(action, input, ctx)),
  };
}
