import type { PluginMetadataWithPaths } from '@halfdomelabs/project-builder-lib';
import type { Logger } from '@halfdomelabs/sync';

export declare function getDefaultPlugins(
  logger: Logger,
): Promise<PluginMetadataWithPaths[]>;
