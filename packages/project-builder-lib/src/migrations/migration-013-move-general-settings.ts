import { createSchemaMigration } from './types.js';

interface OldConfig {
  name: string;
  packageScope: string;
  portOffset: number;
  version?: string;
  cliVersion?: string;
  apps: unknown[];
  features: unknown[];
  models: unknown[];
  enums?: unknown[];
  isInitialized: boolean;
  schemaVersion: number;
  plugins?: unknown;
  theme?: unknown;
  templateExtractor?: unknown;
}

interface NewConfig {
  settings: {
    general: {
      name: string;
      packageScope: string;
      portOffset: number;
    };
    templateExtractor?: unknown;
    theme?: unknown;
  };
  cliVersion?: string;
  apps: unknown[];
  features: unknown[];
  models: unknown[];
  enums?: unknown[];
  isInitialized: boolean;
  schemaVersion: number;
  plugins?: unknown;
}

export const migration013MoveGeneralSettings = createSchemaMigration<
  OldConfig,
  NewConfig
>({
  version: 13,
  name: 'moveGeneralSettings',
  description: 'Move general settings fields from root to settings.general',
  migrate: (config) => {
    const {
      name,
      packageScope,
      portOffset,
      templateExtractor,
      theme,
      ...rest
    } = config;

    return {
      ...rest,
      settings: {
        general: {
          name,
          packageScope,
          portOffset,
        },
        templateExtractor,
        theme,
      },
    };
  },
});
