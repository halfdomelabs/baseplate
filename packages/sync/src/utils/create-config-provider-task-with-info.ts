import type {
  FieldMapSchema,
  FieldMapSchemaBuilder,
  FieldMapValues,
} from '@baseplate-dev/utils';

import { createFieldMap } from '@baseplate-dev/utils';

import type { GeneratorTask } from '#src/generators/generators.js';
import type { ProviderExportScope } from '#src/providers/export-scopes.js';
import type { ProviderType } from '#src/providers/providers.js';

import { createGeneratorTask } from '#src/generators/generators.js';
import {
  createProviderType,
  createReadOnlyProviderType,
} from '#src/providers/providers.js';

/**
 * Options for creating a configuration provider task with additional info
 */
interface ConfigProviderTaskWithInfoOptions<
  Descriptor extends Record<string, unknown>,
  InfoFromDescriptor extends Record<string, unknown>,
> {
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
   * The scope for the config values provider
   */
  configValuesScope?: ProviderExportScope;
  /**
   * Function to extract additional info from the descriptor
   */
  infoFromDescriptor: (descriptor: Descriptor) => InfoFromDescriptor;
}

type ConfigProviderTaskWithInfoResult<
  TSchema extends FieldMapSchema,
  Descriptor extends Record<string, unknown>,
  InfoFromDescriptor extends Record<string, unknown>,
> = [
  // Config task factory function
  (descriptor: Descriptor) => GeneratorTask,
  // Config provider
  ProviderType<TSchema & InfoFromDescriptor>,
  // Config values provider
  ProviderType<FieldMapValues<TSchema> & InfoFromDescriptor>,
];

/**
 * Creates a configuration provider task that exposes both a modifiable config and its resolved values,
 * augmented with additional information extracted from the descriptor
 *
 * This helper creates a task with two providers:
 * 1. A standard provider exposing the field map with modifiable containers, plus additional info
 * 2. An output provider exposing the resolved configuration values (read-only), plus additional info
 *
 * @param schemaBuilder - The schema builder for defining the field map structure
 * @param options - The options for the configuration task
 * @returns A tuple containing a task factory function and both provider types
 *
 * @example
 * ```typescript
 * const [createNodeConfigTask, nodeConfigProvider, nodeConfigValuesProvider] = createConfigProviderTaskWithInfo(
 *   t => ({
 *     port: t.number().default(3000),
 *     host: t.string().default('localhost')
 *   }),
 *   {
 *     prefix: 'node-server',
 *     infoFromDescriptor: (descriptor) => ({
 *       appName: descriptor.name,
 *       environment: descriptor.env
 *     })
 *   }
 * );
 *
 * // Usage:
 * const nodeConfigTask = createNodeConfigTask({ name: 'api', env: 'production' });
 * ```
 */
export function createConfigProviderTaskWithInfo<
  TSchema extends FieldMapSchema,
  Descriptor extends Record<string, unknown>,
  InfoFromDescriptor extends Record<string, unknown>,
>(
  schemaBuilder: (t: FieldMapSchemaBuilder) => TSchema,
  {
    prefix,
    taskName = 'config',
    configScope,
    configValuesScope,
    infoFromDescriptor,
  }: ConfigProviderTaskWithInfoOptions<Descriptor, InfoFromDescriptor>,
): ConfigProviderTaskWithInfoResult<TSchema, Descriptor, InfoFromDescriptor> {
  const configProvider = createProviderType<TSchema & InfoFromDescriptor>(
    `${prefix}-${taskName}-config`,
  );
  const configValuesProvider = createReadOnlyProviderType<
    FieldMapValues<TSchema> & InfoFromDescriptor
  >(`${prefix}-${taskName}-config-values`);

  return [
    (descriptor) =>
      createGeneratorTask({
        exports: { config: configProvider.export(configScope) },
        outputs: {
          configValues: configValuesProvider.export(configValuesScope),
        },
        run() {
          const config = createFieldMap(schemaBuilder);
          const info = infoFromDescriptor(descriptor);
          return {
            providers: { config: { ...config, ...info } },
            build() {
              return { configValues: { ...config.getValues(), ...info } };
            },
          };
        },
      }),
    configProvider,
    configValuesProvider,
  ];
}
