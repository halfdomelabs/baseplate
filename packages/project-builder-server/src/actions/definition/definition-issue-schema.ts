import { z } from 'zod';

export const definitionIssueSchema = z.object({
  message: z.string().describe('Human-readable description of the issue.'),
  entityId: z
    .string()
    .optional()
    .describe('Entity ID this issue is scoped to, if any.'),
  path: z
    .array(z.union([z.string(), z.number()]))
    .describe(
      'Path relative to the entity (or absolute from root if no entityId).',
    ),
  severity: z
    .enum(['error', 'warning'])
    .describe(
      "Issue severity: 'error' blocks the operation, 'warning' does not.",
    ),
  fixLabel: z
    .string()
    .optional()
    .describe('Label for an available auto-fix, if one exists.'),
  fixId: z
    .string()
    .optional()
    .describe('Deterministic ID for this fix, used with the apply-fix action.'),
});
