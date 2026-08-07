import type {
  PluginMetadataWithPaths,
  ProjectInfo,
} from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';
import type { z } from 'zod';

import type { BaseplateUserConfig } from '#src/user-config/user-config-schema.js';

/**
 * A plugin directory that could not be scanned during discovery.
 */
export interface PluginDiscoveryError {
  /** The directory that failed to be scanned. */
  directory: string;
  /** The reason discovery failed. */
  reason: string;
}

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
  /**
   * Directories that failed plugin discovery at startup, e.g. an unparseable
   * package.json. The plugin list is incomplete when this is non-empty.
   *
   * @remarks Only populated by the dev CLI, which discovers plugins from
   * directories at startup. Discovery failures during an action surface as the
   * action's own error instead.
   */
  pluginDiscoveryErrors?: PluginDiscoveryError[];
  /** The logger to write to when executing the service action. */
  logger: Logger;
  /** The version of @baseplate-dev/project-builder-cli. */
  cliVersion: string;
  /** Session ID for draft management. */
  sessionId: string;
}

/**
 * Which clients an action is exposed to.
 *
 * `user` actions are available to end users via the `baseplate` CLI and its MCP
 * server; `dev` actions are additionally restricted to the `baseplate-dev` CLI.
 */
export type ServiceActionScope = 'user' | 'dev';

/**
 * The client-facing description of a service action, excluding its handler.
 *
 * @remarks Kept in a module separate from the handler so that listing actions
 * (MCP tool registration, TRPC router construction, CLI help) does not load the
 * handler's dependencies, which pull in ts-morph and the generator packages.
 */
export interface ServiceActionMetadata<
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
  /** Which clients the action is exposed to. */
  scope: ServiceActionScope;
}

// oxlint-disable-next-line typescript/no-explicit-any -- any is used to allow any input and output shape
export type AnyServiceActionMetadata = ServiceActionMetadata<any, any>;

/**
 * Create the metadata for a service action.
 *
 * @remarks `TName` is inferred as a string literal so the action manifest can
 * derive a union of valid action names from it.
 *
 * @param metadata - The service action metadata to create.
 * @returns The created service action metadata.
 */
export function createServiceActionMetadata<
  TName extends string,
  TInputType extends z.ZodType,
  TOutputType extends z.ZodType,
>(
  metadata: ServiceActionMetadata<TInputType, TOutputType> & { name: TName },
): ServiceActionMetadata<TInputType, TOutputType> & { name: TName } {
  return metadata;
}

/**
 * A service action is a function that can be called by a client via CLI, MCP, or TRPC.
 */
export interface ServiceAction<
  TInputType extends z.ZodType = z.ZodType,
  TOutputType extends z.ZodType = z.ZodType,
> extends ServiceActionMetadata<TInputType, TOutputType> {
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

// oxlint-disable-next-line typescript/no-explicit-any -- any is used to allow any input and output shape
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
