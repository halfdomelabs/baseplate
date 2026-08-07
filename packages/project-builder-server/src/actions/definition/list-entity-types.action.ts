import { createServiceAction } from '#src/actions/types.js';

import { BLACKLISTED_ENTITY_TYPES } from './entity-type-blacklist.js';
import { listEntityTypesMetadata } from './list-entity-types.action-metadata.js';
import { loadEntityServiceContext } from './load-entity-service-context.js';

export const listEntityTypesAction = createServiceAction({
  ...listEntityTypesMetadata,
  writeCliOutput: (output) => {
    for (const entityType of output.entityTypes) {
      const parent = entityType.parentEntityTypeName
        ? ` (parent: ${entityType.parentEntityTypeName})`
        : '';
      console.info(`  ${entityType.name}${parent}`);
    }
  },
  handler: async (input, context) => {
    const { entityContext } = await loadEntityServiceContext(
      input.project,
      context,
    );

    const entityTypes = [...entityContext.entityTypeMap.entries()]
      .filter(([name]) => !BLACKLISTED_ENTITY_TYPES.has(name))
      .map(([name, metadata]) => ({
        name,
        parentEntityTypeName: metadata.parentEntityTypeName ?? null,
      }));

    return { entityTypes };
  },
});
