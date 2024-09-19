/**
 * Represents a schema migration.
 *
 * @template TInputConfig - The type of the input configuration.
 * @template TOutputConfig - The type of the output configuration.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SchemaMigration<TInputConfig = any, TOutputConfig = any> {
  /**
   * The version of the migration. Must be sequential.
   */
  version: number;
  /**
   * The name of the migration.
   */
  name: string;
  /**
   * A description of the migration.
   */
  description: string;
  /**
   * Migrate the configuration.
   *
   * @param config - The configuration to migrate.
   * @returns The migrated configuration.
   */
  migrate: (config: TInputConfig) => TOutputConfig;
}

export type InferSchemaMigrationInputConfig<TMigration> =
  TMigration extends SchemaMigration<infer TInputConfig, unknown>
    ? TInputConfig
    : never;

export type InferSchemaMigrationOutputConfig<TMigration> =
  TMigration extends SchemaMigration<unknown, infer TOutputConfig>
    ? TOutputConfig
    : never;

export function createSchemaMigration<TInputConfig, TOutputConfig>(
  migration: SchemaMigration<TInputConfig, TOutputConfig>,
): SchemaMigration<TInputConfig, TOutputConfig> {
  return migration;
}
