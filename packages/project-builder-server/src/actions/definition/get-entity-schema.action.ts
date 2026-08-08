import { createServiceAction } from '#src/actions/types.js';

import { getEntitySchemaMetadata } from './get-entity-schema.action-metadata.js';
import { loadEntityServiceContext } from './load-entity-service-context.js';
import { schemaToTypeString } from './schema-to-type-string.js';

export const getEntitySchemaAction = createServiceAction({
  ...getEntitySchemaMetadata,
  writeCliOutput: (output) => {
    console.info(output.schema);
  },
  handler: async (input, context) => {
    const { entityContext } = await loadEntityServiceContext(
      input.project,
      context,
    );

    const metadata = entityContext.entityTypeMap.get(input.entityTypeName);
    if (!metadata) {
      throw new Error(
        `Unknown entity type: "${input.entityTypeName}". Use list-entities with entityTypeName "*" to discover available types.`,
      );
    }

    const schemaText = schemaToTypeString(metadata.elementSchema);

    return {
      entityTypeName: input.entityTypeName,
      parentEntityTypeName: metadata.parentEntityTypeName ?? null,
      schema: schemaText,
    };
  },
});
