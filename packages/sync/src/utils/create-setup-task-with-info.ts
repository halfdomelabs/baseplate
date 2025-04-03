import {
  createFieldMap,
  type FieldMapSchema,
  type FieldMapSchemaBuilder,
  type FieldMapValues,
} from '@halfdomelabs/utils';

import type { GeneratorTask } from '@src/generators/generators.js';
import type { ProviderExportScope } from '@src/providers/export-scopes.js';

import { createGeneratorTask } from '@src/generators/generators.js';
import {
  createOutputProviderType,
  createProviderType,
  type ProviderType,
} from '@src/providers/providers.js';

/**
 * Options for creating a setup task builder
 */
export interface CreateSetupTaskWithInfoOptions<
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
   * @default 'setup'
   */
  taskName?: string;
  /**
   * The scope for the config provider
   */
  configScope?: ProviderExportScope;
  /**
   * The scope for the output provider
   */
  outputScope?: ProviderExportScope;
  /**
   * The info from the descriptor
   */
  infoFromDescriptor: (descriptor: Descriptor) => InfoFromDescriptor;
}

export type SetupTaskWithInfoResult<
  TSchema extends FieldMapSchema,
  Descriptor extends Record<string, unknown>,
  InfoFromDescriptor extends Record<string, unknown>,
> = [
  // Setup task
  (descriptor: Descriptor) => GeneratorTask,
  // Config provider
  ProviderType<TSchema & InfoFromDescriptor>,
  // Output provider
  ProviderType<FieldMapValues<TSchema> & InfoFromDescriptor>,
];

/**
 * Creates a setup task with extra info from the descriptor
 *
 * @param schemaBuilder - The schema builder for the setup task
 * @param options - The options for the setup task
 * @returns The setup task builder
 */
export function createSetupTaskWithInfo<
  TSchema extends FieldMapSchema,
  Descriptor extends Record<string, unknown>,
  InfoFromDescriptor extends Record<string, unknown>,
>(
  schemaBuilder: (t: FieldMapSchemaBuilder) => TSchema,
  {
    prefix,
    taskName = 'setup',
    configScope,
    outputScope,
    infoFromDescriptor,
  }: CreateSetupTaskWithInfoOptions<Descriptor, InfoFromDescriptor>,
): SetupTaskWithInfoResult<TSchema, Descriptor, InfoFromDescriptor> {
  const configProvider = createProviderType<TSchema>(
    `${prefix}-${taskName}-config`,
  );
  const outputProvider = createOutputProviderType<FieldMapValues<TSchema>>(
    `${prefix}-${taskName}-output`,
  );

  return [
    (descriptor) =>
      createGeneratorTask({
        name: taskName,
        exports: { config: configProvider.export(configScope) },
        outputs: { output: outputProvider.export(outputScope) },
        run() {
          const fieldMap = createFieldMap(schemaBuilder);
          const info = infoFromDescriptor(descriptor);
          return {
            providers: { config: { ...fieldMap, ...info } },
            build() {
              return { output: { ...fieldMap.getValues(), ...info } };
            },
          };
        },
      }),
    configProvider,
    outputProvider,
  ];
}
