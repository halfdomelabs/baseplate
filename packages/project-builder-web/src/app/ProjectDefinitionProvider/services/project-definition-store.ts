import type {
  PluginMetadataWithPaths,
  ProjectDefinition,
  SchemaParserContext,
} from '@halfdomelabs/project-builder-lib';

import { TypedEventEmitter } from '@halfdomelabs/utils';

export class ProjectDefinitionStore extends TypedEventEmitter<{
  error: unknown;
  projectDefinitionUpdated: ProjectDefinition;
}> {
  public readonly projectId: string;

  constructor(projectId: string) {
    super();

    this.projectId = projectId;
  }

  async load(): Promise<void> {
    //
  }
}
