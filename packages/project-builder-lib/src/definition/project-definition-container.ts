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
import {
  ProjectDefinition,
  projectDefinitionSchema,
} from '@src/schema/index.js';

export class ProjectDefinitionContainer {
  definition: ProjectDefinition;
  references: DefinitionReference[];
  entities: DefinitionEntity[];

  constructor(config: ZodRefPayload<ProjectDefinition>) {
    this.definition = config.data;
    this.references = config.references;
    this.entities = config.entities;
  }

  nameFromId(id: string): string;
  nameFromId(id: string | undefined): string | undefined;
  nameFromId(id: string | undefined): string | undefined {
    if (!id) return undefined;
    const name = this.entities.find((e) => e.id === id)?.name;

    if (!name) {
      throw new Error(`Could not find name for id ${id}`);
    }

    return name;
  }

  fixRefDeletions(
    setter: (draftConfig: ProjectDefinition) => void,
  ): FixRefDeletionResult<typeof projectDefinitionSchema> {
    const newDefinition = produce(setter)(this.definition);
    return fixRefDeletions(projectDefinitionSchema, newDefinition);
  }

  toSerializedConfig(): Record<string, unknown> {
    return serializeSchema(projectDefinitionSchema, this.definition);
  }

  static fromConfig(config: ProjectDefinition): ProjectDefinitionContainer {
    return new ProjectDefinitionContainer(
      ZodRefWrapper.create(projectDefinitionSchema).parse(config),
    );
  }

  static fromSerializedConfig(config: unknown): ProjectDefinitionContainer {
    return new ProjectDefinitionContainer(
      deserializeSchemaWithReferences(projectDefinitionSchema, config),
    );
  }
}
