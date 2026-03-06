export {
  diffDefinition,
  diffSerializedDefinitions,
} from './diff-definition.js';
export type {
  DefinitionDiff,
  DefinitionDiffEntry,
  DiffSerializedDefinitionsOptions,
} from './diff-definition.js';
export { getEntityName } from './entity-utils.js';
export { mergeDataWithSchema } from './merge-data-with-schema.js';
export {
  applyMergedDefinition,
  mergeDefinition,
  mergeDefinitionContainer,
} from './merge-definition.js';
export {
  getMergeRule,
  withByKeyMergeRule,
  withMergeRule,
} from './merge-rule-registry.js';
export type { MergeRule } from './merge-rule-registry.js';
export { collectEntityArrays } from './walk-schema.js';
export type { EntityArrayInfo } from './walk-schema.js';
