import type { Command } from 'commander';

import {
  commitDraftAction,
  discardDraftAction,
  getEntityAction,
  getEntitySchemaAction,
  invokeServiceActionAsCli,
  listEntitiesAction,
  listEntityTypesAction,
  showDraftAction,
  stageCreateEntityAction,
  stageDeleteEntityAction,
  stageUpdateEntityAction,
} from '@baseplate-dev/project-builder-server/actions';

import { createServiceActionContext } from '#src/utils/create-service-action-context.js';
import { resolveProject } from '#src/utils/list-projects.js';

/**
 * Adds definition inspection and mutation commands to the program.
 * @param program - The program to add the commands to.
 */
export function addDefinitionCommand(program: Command): void {
  const definitionCommand = program
    .command('definition')
    .alias('def')
    .description('Inspect and modify project definition entities');

  // --- Read commands ---

  definitionCommand
    .command('list-entity-types [project]')
    .description('List all available entity types in the project definition')
    .action(async (project: string | undefined) => {
      const resolvedProject = await resolveProject(project);
      const context = await createServiceActionContext(resolvedProject);

      await invokeServiceActionAsCli(
        listEntityTypesAction,
        { project: resolvedProject.name },
        context,
      );
    });

  definitionCommand
    .command('list-entities <entityType> [project]')
    .description('List entities of a given type in the project definition')
    .option(
      '--parent <parentEntityId>',
      'Parent entity ID (required for nested types)',
    )
    .action(
      async (
        entityType: string,
        project: string | undefined,
        options: { parent?: string },
      ) => {
        const resolvedProject = await resolveProject(project);
        const context = await createServiceActionContext(resolvedProject);

        await invokeServiceActionAsCli(
          listEntitiesAction,
          {
            project: resolvedProject.name,
            entityTypeName: entityType,
            parentEntityId: options.parent,
          },
          context,
        );
      },
    );

  definitionCommand
    .command('get-entity <entityId> [project]')
    .description('Get the full serialized data for a specific entity by ID')
    .action(async (entityId: string, project: string | undefined) => {
      const resolvedProject = await resolveProject(project);
      const context = await createServiceActionContext(resolvedProject);

      await invokeServiceActionAsCli(
        getEntityAction,
        { project: resolvedProject.name, entityId },
        context,
      );
    });

  definitionCommand
    .command('get-entity-schema <entityType> [project]')
    .description('Get the JSON Schema for a given entity type')
    .action(async (entityType: string, project: string | undefined) => {
      const resolvedProject = await resolveProject(project);
      const context = await createServiceActionContext(resolvedProject);

      await invokeServiceActionAsCli(
        getEntitySchemaAction,
        { project: resolvedProject.name, entityTypeName: entityType },
        context,
      );
    });

  // --- Write commands ---

  definitionCommand
    .command('stage-create <entityType> <entityDataJson> [project]')
    .description('Stage a new entity creation in the draft session')
    .option(
      '--parent <parentEntityId>',
      'Parent entity ID (required for nested types)',
    )
    .action(
      async (
        entityType: string,
        entityDataJson: string,
        project: string | undefined,
        options: { parent?: string },
      ) => {
        const resolvedProject = await resolveProject(project);
        const context = await createServiceActionContext(resolvedProject);
        const entityData = JSON.parse(entityDataJson) as Record<
          string,
          unknown
        >;

        await invokeServiceActionAsCli(
          stageCreateEntityAction,
          {
            project: resolvedProject.name,
            entityTypeName: entityType,
            entityData,
            parentEntityId: options.parent,
          },
          context,
        );
      },
    );

  definitionCommand
    .command('stage-update <entityType> <entityId> <entityDataJson> [project]')
    .description('Stage an entity update in the draft session')
    .action(
      async (
        entityType: string,
        entityId: string,
        entityDataJson: string,
        project: string | undefined,
      ) => {
        const resolvedProject = await resolveProject(project);
        const context = await createServiceActionContext(resolvedProject);
        const entityData = JSON.parse(entityDataJson) as Record<
          string,
          unknown
        >;

        await invokeServiceActionAsCli(
          stageUpdateEntityAction,
          {
            project: resolvedProject.name,
            entityTypeName: entityType,
            entityId,
            entityData,
          },
          context,
        );
      },
    );

  definitionCommand
    .command('stage-delete <entityType> <entityId> [project]')
    .description('Stage an entity deletion in the draft session')
    .action(
      async (
        entityType: string,
        entityId: string,
        project: string | undefined,
      ) => {
        const resolvedProject = await resolveProject(project);
        const context = await createServiceActionContext(resolvedProject);

        await invokeServiceActionAsCli(
          stageDeleteEntityAction,
          {
            project: resolvedProject.name,
            entityTypeName: entityType,
            entityId,
          },
          context,
        );
      },
    );

  // --- Draft management commands ---

  definitionCommand
    .command('commit [project]')
    .description('Commit the draft session to project-definition.json')
    .action(async (project: string | undefined) => {
      const resolvedProject = await resolveProject(project);
      const context = await createServiceActionContext(resolvedProject);

      await invokeServiceActionAsCli(
        commitDraftAction,
        { project: resolvedProject.name },
        context,
      );
    });

  definitionCommand
    .command('discard [project]')
    .description('Discard the current draft session')
    .action(async (project: string | undefined) => {
      const resolvedProject = await resolveProject(project);
      const context = await createServiceActionContext(resolvedProject);

      await invokeServiceActionAsCli(
        discardDraftAction,
        { project: resolvedProject.name },
        context,
      );
    });

  definitionCommand
    .command('show-draft [project]')
    .description('Show the current draft session status')
    .action(async (project: string | undefined) => {
      const resolvedProject = await resolveProject(project);
      const context = await createServiceActionContext(resolvedProject);

      await invokeServiceActionAsCli(
        showDraftAction,
        { project: resolvedProject.name },
        context,
      );
    });
}
