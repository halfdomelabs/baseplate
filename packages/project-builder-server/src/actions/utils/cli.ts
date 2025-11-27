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
  TInputType extends z.ZodType,
  TOutputType extends z.ZodType,
>(
  action: ServiceAction<TInputType, TOutputType>,
  input: z.input<TInputType>,
  context: ServiceActionContext,
): Promise<z.output<TOutputType>> {
  const parsedInput = action.inputSchema.parse(input);
  const result = await action.handler(parsedInput, context);
  const parsedResult = action.outputSchema.parse(result);

  action.writeCliOutput?.(parsedResult, parsedInput);

  return parsedResult;
}
