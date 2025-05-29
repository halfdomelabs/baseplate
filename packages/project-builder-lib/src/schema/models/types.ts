import { createEntityType } from '#src/references/index.js';

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

export const modelUniqueConstraintEntityType = createEntityType(
  'model-unique-constraint',
  { parentType: modelEntityType },
);

export const modelTransformerEntityType = createEntityType(
  'model-transformer',
  { parentType: modelEntityType },
);

export const modelEnumEntityType = createEntityType('model-enum');

export const modelEnumValueEntityType = createEntityType('model-enum-value', {
  parentType: modelEnumEntityType,
});
