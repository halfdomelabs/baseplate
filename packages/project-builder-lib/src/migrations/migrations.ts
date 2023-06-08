import { ProjectConfig } from '@src/schema/index.js';

export interface SchemaMigration {
  version: number;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  migrate: (config: any) => ProjectConfig;
}

export const SCHEMA_MIGRATIONS: SchemaMigration[] = [
  {
    version: 1,
    description: "Rename 'portBase' to 'portOffset' to project config",
    migrate: ({
      portBase,
      ...config
    }: ProjectConfig & { portBase: number }) => ({
      ...config,
      portOffset: config.portOffset || portBase,
    }),
  },
];
