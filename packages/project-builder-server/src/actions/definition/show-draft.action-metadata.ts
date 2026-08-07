import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

const showDraftInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
});
const draftChangeSchema = z.object({
  label: z
    .string()
    .describe('Human-readable label (e.g., "Feature: payments").'),
  type: z.enum(['added', 'updated', 'removed']).describe('The type of change.'),
  details: z
    .string()
    .nullable()
    .describe(
      'For added: the entity JSON. For updated: a JSON Patch (RFC 6902) array. Null for removed.',
    ),
});
const showDraftOutputSchema = z.object({
  hasDraft: z.boolean().describe('Whether a draft session exists.'),
  sessionId: z
    .string()
    .nullable()
    .describe('The session ID of the draft, or null if no draft.'),
  definitionHash: z
    .string()
    .nullable()
    .describe(
      'The hash of the project definition when the draft was created, or null if no draft.',
    ),
  changes: z
    .array(draftChangeSchema)
    .nullable()
    .describe('Entity-level changes in the draft, or null if no draft.'),
});

export const showDraftMetadata = createServiceActionMetadata({
  name: 'show-draft',
  title: 'Show Draft',
  description:
    'Show the current draft session status and staged changes for a project.',
  inputSchema: showDraftInputSchema,
  outputSchema: showDraftOutputSchema,
  scope: 'user',
});
