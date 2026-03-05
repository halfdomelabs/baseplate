import type { PluginStore } from '#src/plugins/imports/types.js';

export type ProjectType = 'user' | 'example' | 'test';

export interface ProjectInfo {
  /** A deterministic ID for the project based off the directory. */
  id: string;
  /** The name of the project. */
  name: string;
  /** The directory of the project output. */
  directory: string;
  /** The type of the project. */
  type: ProjectType;
  /** The baseplate directory containing project-definition.json and snapshots. */
  baseplateDirectory: string;
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
