/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ModelClassSpecifier, RelationMappings } from 'objection';
import R from 'ramda';

function resolveModelClass(
  modelClass: ModelClassSpecifier
): ModelClassSpecifier {
  if (typeof modelClass !== 'string') {
    return modelClass;
  }
  // eslint-disable-next-line global-require
  const modelsModule = require('../../models') as Record<
    string,
    ModelClassSpecifier
  >;
  if (!Object.prototype.hasOwnProperty.call(modelsModule, modelClass)) {
    throw new Error(`Could not find model: ${modelClass}`);
  }
  return modelsModule[modelClass];
}

/**
 * Dynamically resolve relation mappings to avoid require loops. Manual
 * function required since modelPaths IMO are fragile / harder to maintain
 *
 * https://vincit.github.io/objection.js/guide/relations.html#require-loops
 *
 * @param mappings Original relation mappings
 */
export function resolveRelationMappings(
  mappings: RelationMappings
): RelationMappings {
  return R.map(
    (mapping) => ({
      ...mapping,
      modelClass: resolveModelClass(mapping.modelClass),
    }),
    mappings
  );
}
