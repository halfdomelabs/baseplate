import { createServiceAction } from '#src/actions/types.js';

import { loadEntityServiceContext } from './load-entity-service-context.js';
import { searchEntitiesMetadata } from './search-entities.action-metadata.js';

export const searchEntitiesAction = createServiceAction({
  ...searchEntitiesMetadata,
  writeCliOutput: (output) => {
    if (output.results.length === 0) {
      console.info('  No matching entities found.');
      return;
    }
    for (const entity of output.results) {
      console.info(`  ${entity.name} (${entity.type}) [${entity.id}]`);
    }
  },
  handler: async (input, context) => {
    const { container } = await loadEntityServiceContext(
      input.project,
      context,
    );

    const queryLower = input.query.toLowerCase();

    const results = container.entities
      .filter((entity) => {
        if (input.entityTypeName && entity.type.name !== input.entityTypeName) {
          return false;
        }
        return entity.name.toLowerCase().includes(queryLower);
      })
      .map((entity) => ({
        id: entity.id,
        name: entity.name,
        type: entity.type.name,
      }));

    return { results };
  },
});
