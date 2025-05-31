import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';
import type { Logger } from '@baseplate-dev/sync';

export declare function getDefaultPlugins(
  logger: Logger,
): Promise<PluginMetadataWithPaths[]>;
