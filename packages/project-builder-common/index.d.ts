import type { PluginMetadataWithPaths } from '@halfdomelabs/project-builder-lib';
import type { GeneratorEngineSetupConfig } from '@halfdomelabs/project-builder-server';
import type { Logger } from '@halfdomelabs/sync';

export declare function getDefaultPlugins(
  logger: Logger,
): Promise<PluginMetadataWithPaths[]>;

export declare function getDefaultGeneratorSetupConfig(
  logger: Logger,
): Promise<GeneratorEngineSetupConfig>;
