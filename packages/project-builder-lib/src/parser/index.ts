export { applyDefinitionFixes } from './apply-definition-fixes.js';
export { cleanDefaultValues } from './clean-default-values.js';
export {
  collectDefinitionIssues,
  collectFieldIssues,
  partitionIssuesBySeverity,
} from './collect-definition-issues.js';
export type { PartitionedIssues } from './collect-definition-issues.js';
export { collectExpressionIssues } from './collect-expression-issues.js';
export {
  createEntityIssue,
  createIssueFixSetter,
  resolveIssuePath,
} from './definition-issue-utils.js';
export * from './parser.js';
export { findDiscriminatedUnionMatch } from './schema-structure.js';
export { transformDataWithSchema } from './transform-data-with-schema.js';
export type * from './types.js';
export { walkDataWithSchema } from './walk-data-with-schema.js';
