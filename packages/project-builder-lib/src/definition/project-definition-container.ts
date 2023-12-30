import { produce } from 'immer';

import {
  DefinitionEntity,
  DefinitionReference,
  FixRefDeletionResult,
  ZodRefPayload,
  ZodRefWrapper,
  deserializeSchemaWithReferences,
  fixRefDeletions,
  serializeSchema,
} from '@src/references/index.js';
import { ProjectConfig, projectConfigSchema } from '@src/schema/index.js';

export class ProjectDefinitionContainer {
  definition: ProjectConfig;
  references: DefinitionReference[];
  entities: DefinitionEntity[];

  constructor(config: ZodRefPayload<ProjectConfig>) {
    this.definition = config.data;
    this.references = config.references;
    this.entities = config.entities;
  }

  nameFromId(id: string): string {
    const name = this.entities.find((e) => e.id === id)?.name;

    if (!name) {
      throw new Error(`Could not find name for id ${id}`);
    }

    return name;
  }

  fixRefDeletions(
    setter: (draftConfig: ProjectConfig) => void,
  ): FixRefDeletionResult<typeof projectConfigSchema> {
    const newDefinition = produce(setter)(this.definition);
    return fixRefDeletions(projectConfigSchema, newDefinition);
  }

  toSerializedConfig(): Record<string, unknown> {
    return serializeSchema(projectConfigSchema, this.definition);
  }

  static fromConfig(config: ProjectConfig): ProjectDefinitionContainer {
    return new ProjectDefinitionContainer(
      ZodRefWrapper.create(projectConfigSchema).parse(config),
    );
  }

  static fromSerializedConfig(config: unknown): ProjectDefinitionContainer {
    return new ProjectDefinitionContainer(
      deserializeSchemaWithReferences(projectConfigSchema, config),
    );
  }
}
