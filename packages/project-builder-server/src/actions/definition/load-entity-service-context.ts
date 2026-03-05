import type { EntityServiceContext } from '@baseplate-dev/project-builder-lib';

import { ProjectDefinitionContainer } from '@baseplate-dev/project-builder-lib';

import type { ServiceActionContext } from '#src/actions/types.js';

import { createNodeSchemaParserContext } from '#src/plugins/node-plugin-store.js';
import { loadProjectDefinition } from '#src/project-definition/load-project-definition.js';

import { getProjectByNameOrId } from '../utils/projects.js';

export interface EntityServiceContextResult {
  entityContext: EntityServiceContext;
  container: ProjectDefinitionContainer;
}

/**
 * Loads a project definition and builds an EntityServiceContext for entity operations.
 *
 * Shared helper used by all definition read actions.
 */
export async function loadEntityServiceContext(
  projectNameOrId: string,
  context: ServiceActionContext,
): Promise<EntityServiceContextResult> {
  const project = getProjectByNameOrId(context.projects, projectNameOrId);

  const parserContext = await createNodeSchemaParserContext(
    project,
    context.logger,
    context.plugins,
    context.cliVersion,
  );

  const { definition } = await loadProjectDefinition(
    project.directory,
    parserContext,
  );

  const container = ProjectDefinitionContainer.fromSerializedConfig(
    definition,
    parserContext,
  );

  const entityContext = container.toEntityServiceContext();

  return { entityContext, container };
}
