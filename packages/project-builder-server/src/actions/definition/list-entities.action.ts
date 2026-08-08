import { listEntities } from '@baseplate-dev/project-builder-lib';

import { createServiceAction } from '#src/actions/types.js';

import { listEntitiesMetadata } from './list-entities.action-metadata.js';
import { loadEntityServiceContext } from './load-entity-service-context.js';

export const listEntitiesAction = createServiceAction({
  ...listEntitiesMetadata,
  writeCliOutput: (output) => {
    for (const entity of output.entities) {
      console.info(`  ${entity.name} (${entity.id})`);
    }
  },
  handler: async (input, context) => {
    const { entityContext } = await loadEntityServiceContext(
      input.project,
      context,
    );

    const entities = listEntities(
      {
        entityTypeName: input.entityTypeName,
        parentEntityId: input.parentEntityId,
      },
      entityContext,
    );

    return { entities };
  },
});
