import { createEntityType } from '@src/references/index.js';

export const modelEntityType = createEntityType('model');

export const modelScalarFieldEntityType = createEntityType(
  'model-scalar-field',
  {
    parentType: modelEntityType,
  },
);

export const modelLocalRelationEntityType = createEntityType(
  'model-local-relation',
  { parentType: modelEntityType },
);

export const modelForeignRelationEntityType = createEntityType(
  'model-foreign-relation',
  { parentType: modelEntityType },
);

export const modelTransformerEntityType = createEntityType(
  'model-transformer',
  { parentType: modelEntityType },
);

export const modelEnumEntityType = createEntityType('model-enum');
