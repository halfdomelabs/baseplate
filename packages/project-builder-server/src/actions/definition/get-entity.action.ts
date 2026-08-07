import { getEntity } from '@baseplate-dev/project-builder-lib';
import { stringifyPrettyStable } from '@baseplate-dev/utils';

import { createServiceAction } from '#src/actions/types.js';

import { getEntityMetadata } from './get-entity.action-metadata.js';
import { loadEntityServiceContext } from './load-entity-service-context.js';

export const getEntityAction = createServiceAction({
  ...getEntityMetadata,
  writeCliOutput: (output) => {
    if (output.entity === null) {
      console.info('Entity not found.');
      return;
    }
    console.info(stringifyPrettyStable(output.entity));
  },
  handler: async (input, context) => {
    const { entityContext } = await loadEntityServiceContext(
      input.project,
      context,
    );

    const entity = getEntity(input.entityId, entityContext);

    return { entity: entity ?? null };
  },
});
