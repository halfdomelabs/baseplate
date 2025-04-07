import type {
  FieldMap,
  FieldMapSchema,
  FieldMapSchemaBuilder,
  FieldMapValues,
} from '@halfdomelabs/utils';

import { createFieldMap } from '@halfdomelabs/utils';

import type { ProviderExportScope } from '@src/providers/export-scopes.js';

import {
  createGeneratorTask,
  type GeneratorTask,
} from '@src/generators/generators.js';
import {
  createProviderType,
  createReadOnlyProviderType,
  type ProviderType,
} from '@src/providers/providers.js';

/**
 * Options for creating a configuration provider task
 */
export interface ConfigProviderTaskOptions {
  /**
   * The prefix for the providers
   */
  prefix: string;
  /**
   * The name of the task
   *
   * @default 'config'
   */
  taskName?: string;
  /**
   * The scope for the config provider
   */
  configScope?: ProviderExportScope;
  /**
   * The scope for the config values output provider
   */
  configValuesScope?: ProviderExportScope;
}

export type ConfigProviderTaskResult<TSchema extends FieldMapSchema> = [
  // Config task
  GeneratorTask,
  // Field map provider with modifiable containers
  ProviderType<FieldMap<TSchema>>,
  // Resolved values provider
  ProviderType<FieldMapValues<TSchema>>,
];

/**
 * Creates a configuration provider task that exposes both a modifiable config map and its resolved values
 *
 * This helper creates a task with two providers:
 * 1. A standard provider exposing the field map with modifiable containers
 * 2. An output provider exposing the resolved configuration values (read-only)
 *
 * The field map contains containers for each field that can be modified by calling
 * methods like set(), push(), or merge() depending on the container type.
 *
 * @param schemaBuilder - The schema builder for defining the field map structure
 * @param options - The options for the configuration task
 * @returns A tuple containing the generator task and both provider types
 *
 * @example
 * ```typescript
 * const [nodeConfigTask, nodeConfigProvider, nodeConfigValuesProvider] = createConfigProviderTask(
 *   t => ({
 *     port: t.number().default(3000),
 *     host: t.string().default('localhost')
 *   }),
 *   { prefix: 'node-server' }
 * );
 *
 * // In a consuming task:
 * // 1. Modify the field map containers:
 * deps.nodeConfigProvider.port.set(4000, 'environment-override');
 *
 * // 2. Read the resolved values:
 * const config = deps.nodeConfigValues;
 * console.log(config.port); // 4000
 * ```
 */
export function createConfigProviderTask<TSchema extends FieldMapSchema>(
  schemaBuilder: (t: FieldMapSchemaBuilder) => TSchema,
  {
    prefix,
    taskName = 'config',
    configScope,
    configValuesScope,
  }: ConfigProviderTaskOptions,
): ConfigProviderTaskResult<TSchema> {
  const configProvider = createProviderType<TSchema>(
    `${prefix}-${taskName}-config`,
  );
  const configValuesProvider = createReadOnlyProviderType<
    FieldMapValues<TSchema>
  >(`${prefix}-${taskName}-config-values`);

  return [
    createGeneratorTask({
      exports: { config: configProvider.export(configScope) },
      outputs: { configValues: configValuesProvider.export(configValuesScope) },
      run() {
        const config = createFieldMap(schemaBuilder);
        return {
          providers: { config },
          build() {
            return { configValues: config.getValues() };
          },
        };
      },
    }),
    configProvider,
    configValuesProvider,
  ];
}
