import {
  DefinitionEntity,
  DefinitionReference,
  ZodRefPayload,
  ZodRefWrapper,
  deserializeSchemaWithReferences,
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
