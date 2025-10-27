import type { PluginStore } from '#src/plugins/imports/types.js';

export interface ProjectInfo {
  /** A deterministic ID for the project based off the directory. */
  id: string;
  /** The name of the project. */
  name: string;
  /** The directory of the project. */
  directory: string;
  /** Whether the project is an internal example project. */
  isInternalExample: boolean;
}

/**
 * The context available to the schema parser, including the plugin store.
 */
export interface SchemaParserContext {
  /**
   * The plugin store.
   */
  pluginStore: PluginStore;
  /**
   * The version of the CLI that is being used.
   */
  cliVersion: string;
  /**
   * The project information.
   */
  project: ProjectInfo;
}
