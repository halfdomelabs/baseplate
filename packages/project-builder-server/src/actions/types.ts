import type {
  PluginMetadataWithPaths,
  ProjectInfo,
} from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';
import type { z } from 'zod';

import type { BaseplateUserConfig } from '#src/user-config/user-config-schema.js';

/**
 * The context provided to a service action.
 *
 * @remarks All properties must be serializable for worker thread communication. (except logger which we proxy)
 */
export interface ServiceActionContext {
  /** The projects available to the project builder. */
  projects: ProjectInfo[];
  /** The user config for the project builder. */
  userConfig: BaseplateUserConfig;
  /** The plugins available to the project builder. */
  plugins: PluginMetadataWithPaths[];
  /** The logger to write to when executing the service action. */
  logger: Logger;
  /** The version of @baseplate-dev/project-builder-cli. */
  cliVersion: string;
}

/**
 * A service action is a function that can be called by a client via CLI, MCP, or TRPC.
 */
export interface ServiceAction<
  TInputType extends z.ZodType = z.ZodType,
  TOutputType extends z.ZodType = z.ZodType,
> {
  /** The name of the service action in kebab case. */
  name: string;
  /** The title of the service action. */
  title: string;
  /** The description of the service action. */
  description: string;
  /** The input schema of the service action. */
  inputSchema: TInputType;
  /** The output schema of the service action. */
  outputSchema: TOutputType;
  /** The handler of the service action. */
  handler: (
    input: z.output<TInputType>,
    context: ServiceActionContext,
  ) => Promise<z.input<TOutputType>> | z.input<TOutputType>;
  /**
   * (Optional) A function to write the output to the CLI.
   * If not provided, the CLI will default to printing the raw JSON output.
   */
  writeCliOutput?: (
    output: z.output<TOutputType>,
    input: z.output<TInputType>,
  ) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- any is used to allow any input and output shape
export type AnyServiceAction = ServiceAction<any, any>;

/**
 * Create a service action.
 * @param action - The service action to create.
 * @returns The created service action.
 */
export function createServiceAction<
  TInputType extends z.ZodType,
  TOutputType extends z.ZodType,
>(
  action: ServiceAction<TInputType, TOutputType>,
): ServiceAction<TInputType, TOutputType> {
  return action;
}
