import { PluginMetadataWithPaths } from "@halfdomelabs/project-builder-lib";
import { GeneratorEngineSetupConfig } from "@halfdomelabs/project-builder-server";
import { Logger } from "@halfdomelabs/sync";

export declare function getDefaultPlugins(
  logger: Logger,
): Promise<PluginMetadataWithPaths[]>;

export declare function getDefaultGeneratorSetupConfig(
  logger: Logger,
): Promise<GeneratorEngineSetupConfig>;
