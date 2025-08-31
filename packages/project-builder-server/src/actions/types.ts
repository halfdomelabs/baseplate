import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';
import type { z } from 'zod';

import type { BaseplateUserConfig } from '#src/user-config/user-config-schema.js';

/**
 * A project available to the project builder.
 */
export interface ServiceActionProject {
  /** A deterministic ID for the project based off the directory. */
  id: string;
  /** The name of the project. */
  name: string;
  /** The directory of the project. */
  directory: string;
}

/**
 * The context provided to a service action.
 *
 * @remarks All properties must be serializable for worker thread communication. (except logger which we proxy)
 */
export interface ServiceActionContext {
  /** The projects available to the project builder. */
  projects: ServiceActionProject[];
  /** The user config for the project builder. */
  userConfig: BaseplateUserConfig;
  /** The plugins available to the project builder. */
  plugins: PluginMetadataWithPaths[];
  /** The logger to write to when executing the service action. */
  logger: Logger;
}

/**
 * A service action is a function that can be called by a client via CLI, MCP, or TRPC.
 */
export interface ServiceAction<
  TInputShape extends z.ZodRawShape = z.ZodRawShape,
  TOutputShape extends z.ZodRawShape = z.ZodRawShape,
> {
  /** The name of the service action in kebab case. */
  name: string;
  /** The title of the service action. */
  title: string;
  /** The description of the service action. */
  description: string;
  /** The input schema of the service action. */
  inputSchema: TInputShape;
  /** The output schema of the service action. */
  outputSchema: TOutputShape;
  /** The handler of the service action. */
  handler: (
    input: z.objectOutputType<TInputShape, z.ZodTypeAny, 'strip'>,
    context: ServiceActionContext,
  ) =>
    | Promise<z.objectInputType<TOutputShape, z.ZodTypeAny, 'strip'>>
    | z.objectInputType<TOutputShape, z.ZodTypeAny, 'strip'>;
  /**
   * (Optional) A function to write the output to the CLI.
   * If not provided, the CLI will default to printing the raw JSON output.
   */
  writeCliOutput?: (
    output: z.objectInputType<TOutputShape, z.ZodTypeAny, 'strip'>,
    input: z.objectInputType<TInputShape, z.ZodTypeAny, 'strip'>,
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
  TInputShape extends z.ZodRawShape,
  TOutputShape extends z.ZodRawShape,
>(
  action: ServiceAction<TInputShape, TOutputShape>,
): ServiceAction<TInputShape, TOutputShape> {
  return action;
}
