import {
  createFieldMap,
  type FieldMapSchema,
  type FieldMapSchemaBuilder,
  type FieldMapValues,
} from '@halfdomelabs/utils';

import type { ProviderExportScope } from '@src/providers/export-scopes.js';

import {
  createOutputProviderType,
  createProviderType,
  type ProviderType,
} from '@src/providers/providers.js';

import type { SimpleGeneratorTaskConfig } from './create-generator-types.js';

/**
 * Options for creating a setup task builder
 */
export interface CreateSetupTaskOptions {
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
}

export type SetupTaskResult<TSchema extends FieldMapSchema> = [
  // Setup task
  SimpleGeneratorTaskConfig,
  // Config provider
  ProviderType<TSchema>,
  // Output provider
  ProviderType<FieldMapValues<TSchema>>,
];

/**
 * Creates a setup task
 *
 * @param schemaBuilder - The schema builder for the setup task
 * @param options - The options for the setup task
 * @returns The setup task builder
 */
export function createSetupTask<TSchema extends FieldMapSchema>(
  schemaBuilder: (t: FieldMapSchemaBuilder) => TSchema,
  {
    prefix,
    taskName = 'setup',
    configScope,
    outputScope,
  }: CreateSetupTaskOptions,
): SetupTaskResult<TSchema> {
  const configProvider = createProviderType<TSchema>(
    `${prefix}-${taskName}-config`,
  );
  const outputProvider = createOutputProviderType<FieldMapValues<TSchema>>(
    `${prefix}-${taskName}-output`,
  );

  return [
    {
      name: taskName,
      exports: { config: configProvider.export(configScope) },
      outputs: { output: outputProvider.export(outputScope) },
      run() {
        const fieldMap = createFieldMap(schemaBuilder);
        return {
          providers: { config: fieldMap },
          build() {
            return { output: fieldMap.getValues() };
          },
        };
      },
    },
    configProvider,
    outputProvider,
  ];
}
