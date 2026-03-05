import type { Command } from 'commander';

import {
  getEntityAction,
  getEntitySchemaAction,
  invokeServiceActionAsCli,
  listEntitiesAction,
  listEntityTypesAction,
} from '@baseplate-dev/project-builder-server/actions';
import { stringifyPrettyStable } from '@baseplate-dev/utils';

import { createServiceActionContext } from '#src/utils/create-service-action-context.js';
import { resolveProject } from '#src/utils/list-projects.js';

/**
 * Adds definition inspection commands to the program.
 * @param program - The program to add the commands to.
 */
export function addDefinitionCommand(program: Command): void {
  const definitionCommand = program
    .command('definition')
    .alias('def')
    .description('Inspect project definition entities and schemas');

  definitionCommand
    .command('list-entity-types [project]')
    .description('List all available entity types in the project definition')
    .action(async (project: string | undefined) => {
      const resolvedProject = await resolveProject(project);
      const context = await createServiceActionContext(resolvedProject);

      const result = await invokeServiceActionAsCli(
        listEntityTypesAction,
        { project: resolvedProject.name },
        context,
      );

      for (const entityType of result.entityTypes) {
        const parent = entityType.parentEntityTypeName
          ? ` (parent: ${entityType.parentEntityTypeName})`
          : '';
        console.info(`  ${entityType.name}${parent}`);
      }
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

        const result = await invokeServiceActionAsCli(
          listEntitiesAction,
          {
            project: resolvedProject.name,
            entityTypeName: entityType,
            parentEntityId: options.parent,
          },
          context,
        );

        for (const entity of result.entities) {
          console.info(`  ${entity.name} (${entity.id})`);
        }
      },
    );

  definitionCommand
    .command('get-entity <entityId> [project]')
    .description('Get the full serialized data for a specific entity by ID')
    .action(async (entityId: string, project: string | undefined) => {
      const resolvedProject = await resolveProject(project);
      const context = await createServiceActionContext(resolvedProject);

      const result = await invokeServiceActionAsCli(
        getEntityAction,
        { project: resolvedProject.name, entityId },
        context,
      );

      if (result.entity === null) {
        console.info(`Entity not found: ${entityId}`);
        return;
      }

      console.info(stringifyPrettyStable(result.entity));
    });

  definitionCommand
    .command('get-entity-schema <entityType> [project]')
    .description('Get the JSON Schema for a given entity type')
    .action(async (entityType: string, project: string | undefined) => {
      const resolvedProject = await resolveProject(project);
      const context = await createServiceActionContext(resolvedProject);

      const result = await invokeServiceActionAsCli(
        getEntitySchemaAction,
        { project: resolvedProject.name, entityTypeName: entityType },
        context,
      );

      console.info(stringifyPrettyStable(result.schema));
    });
}
