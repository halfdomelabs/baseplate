import { stringifyPrettyStable } from '@baseplate-dev/utils';
import { produce } from 'immer';

import type { SchemaParserContext } from '#src/parser/types.js';
import type { PluginSpecStore } from '#src/plugins/index.js';
import type {
  DefinitionEntity,
  DefinitionReference,
  FixRefDeletionResult,
  ResolvedZodRefPayload,
} from '#src/references/index.js';
import type { ProjectDefinition } from '#src/schema/index.js';

import {
  createPluginSpecStore,
  parseProjectDefinitionWithReferences,
} from '#src/parser/parser.js';
import {
  deserializeSchemaWithTransformedReferences,
  fixRefDeletions,
  serializeSchema,
} from '#src/references/index.js';
import { createProjectDefinitionSchema } from '#src/schema/index.js';

/**
 * Container for a project definition that includes references and entities.
 *
 * This class provides utility methods for working with a project definition
 * such as the ability to fetch an entity by ID.
 */
export class ProjectDefinitionContainer {
  refPayload: ResolvedZodRefPayload<ProjectDefinition>;
  definition: ProjectDefinition;
  references: DefinitionReference[];
  entities: DefinitionEntity[];
  parserContext: SchemaParserContext;
  pluginStore: PluginSpecStore;

  constructor(
    config: ResolvedZodRefPayload<ProjectDefinition>,
    parserContext: SchemaParserContext,
    pluginStore: PluginSpecStore,
  ) {
    this.refPayload = config;
    this.definition = config.data;
    this.references = config.references;
    this.entities = config.entities;
    this.parserContext = parserContext;
    this.pluginStore = pluginStore;
  }

  /**
   * Fetches the name of an entity by its ID.
   *
   * @param id The ID of the entity to fetch
   * @returns The name of the entity
   */
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

  /**
   * Fetches the name of an entity by its ID, returning undefined if the ID is not found.
   *
   * @param id The ID of the entity to fetch
   * @returns The name of the entity, or undefined if the ID is not found
   */
  safeNameFromId(id: string | undefined): string | undefined {
    if (!id) return undefined;
    const name = this.entities.find((e) => e.id === id)?.name;

    return name;
  }

  /**
   * Fix any reference deletions that would occur when applying the given setter.
   *
   * @param setter A function that modifies the project definition
   * @returns A result indicating whether the reference deletions were fixed
   */
  fixRefDeletions(
    setter: (draftConfig: ProjectDefinition) => void,
  ): FixRefDeletionResult<typeof createProjectDefinitionSchema> {
    const newDefinition = produce(setter)(this.definition);
    return fixRefDeletions(createProjectDefinitionSchema, newDefinition, {
      plugins: this.pluginStore,
    });
  }

  /**
   * Serializes the project definition resolving references to their names for easier reading.
   *
   * @returns The serialized contents of the project definition
   */
  toSerializedContents(): string {
    const serializedContents = serializeSchema(
      createProjectDefinitionSchema,
      this.definition,
      {
        defaultMode: 'strip',
        plugins: this.pluginStore,
      },
    );
    return stringifyPrettyStable(serializedContents);
  }

  /**
   * Creates a new ProjectDefinitionContainer from a raw project definition.
   *
   * @param definition The raw project definition
   * @param context The parser context to use
   * @returns A new ProjectDefinitionContainer
   */
  static fromDefinition(
    definition: ProjectDefinition,
    context: SchemaParserContext,
  ): ProjectDefinitionContainer {
    const { definition: parsedDefinition, pluginStore } =
      parseProjectDefinitionWithReferences(definition, context);
    return new ProjectDefinitionContainer(
      parsedDefinition,
      context,
      pluginStore,
    );
  }

  /**
   * Creates a new ProjectDefinitionContainer from a serialized configuration.
   *
   * @param config The serialized configuration
   * @param context The parser context to use
   * @returns A new ProjectDefinitionContainer
   */
  static fromSerializedConfig(
    config: unknown,
    context: SchemaParserContext,
  ): ProjectDefinitionContainer {
    const plugins = createPluginSpecStore(context.pluginStore, config);
    return new ProjectDefinitionContainer(
      deserializeSchemaWithTransformedReferences(
        createProjectDefinitionSchema,
        config,
        { plugins },
      ),
      context,
      plugins,
    );
  }
}
