import type z from 'zod';

import type { ServiceAction, ServiceActionContext } from '../types.js';

/**
 * Invoke a service action as a CLI command running the handler and writing the output to the CLI.
 *
 * @param action - The service action to invoke.
 * @param input - The input to pass to the service action.
 * @param context - The context to pass to the service action.
 * @returns The result of the service action.
 */
export async function invokeServiceActionAsCli<
  TInputShape extends z.ZodRawShape,
  TOutputShape extends z.ZodRawShape,
>(
  action: ServiceAction<TInputShape, TOutputShape>,
  input: z.infer<z.ZodObject<TInputShape>>,
  context: ServiceActionContext,
): Promise<z.infer<z.ZodObject<TOutputShape>>> {
  const result = await action.handler(input, context);

  action.writeCliOutput?.(result, input);

  return result;
}
