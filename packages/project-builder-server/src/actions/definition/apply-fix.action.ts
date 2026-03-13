import {
  collectDefinitionIssues,
  createIssueFixSetter,
  ProjectDefinitionContainer,
  serializeSchema,
} from '@baseplate-dev/project-builder-lib';
import { produce } from 'immer';
import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

import { getOrCreateDraftSession, saveDraftSession } from './draft-session.js';
import {
  definitionIssueSchema,
  fixAndValidateDraftDefinition,
  generateFixId,
  mapIssueToOutput,
} from './validate-draft.js';

const applyFixInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
  fixId: z
    .string()
    .describe(
      'The deterministic fix ID returned by stage actions (e.g., "fix-a1b2c3d4").',
    ),
});

const applyFixOutputSchema = z.object({
  message: z.string().describe('A summary of the applied fix.'),
  issues: z
    .array(definitionIssueSchema)
    .optional()
    .describe('Remaining definition issues after applying the fix.'),
});

export const applyFixAction = createServiceAction({
  name: 'apply-fix',
  title: 'Apply Fix',
  description:
    'Apply an auto-fix for a definition issue in the current draft session.',
  inputSchema: applyFixInputSchema,
  outputSchema: applyFixOutputSchema,
  handler: async (input, context) => {
    const { session, parserContext, projectDirectory } =
      await getOrCreateDraftSession(input.project, context);

    // Build container from draft definition to collect issues
    const container = ProjectDefinitionContainer.fromSerializedConfig(
      session.draftDefinition,
      parserContext,
    );

    const issues = collectDefinitionIssues(container);

    // Find the issue matching the fix ID
    const matchingIssue = issues.find(
      (issue) => issue.fix && generateFixId(issue) === input.fixId,
    );

    if (!matchingIssue) {
      throw new Error(
        `No fixable issue found with ID "${input.fixId}". ` +
          'The fix may no longer be applicable or the ID may be incorrect.',
      );
    }

    const setter = createIssueFixSetter(matchingIssue, container);
    if (!setter) {
      throw new Error(
        `Issue "${matchingIssue.message}" has no applicable fix.`,
      );
    }

    // Apply the fix to the parsed definition
    const fixedDefinition = produce(setter)(container.definition);

    // Serialize back to name-based format via the schema
    const fixedSerializedDef = serializeSchema(
      container.schema,
      fixedDefinition,
    ) as Record<string, unknown>;

    // Run fixAndValidateDraftDefinition on the result
    const { fixedSerializedDefinition, errors, warnings } =
      fixAndValidateDraftDefinition(fixedSerializedDef, parserContext);

    if (errors.length > 0) {
      const messages = errors.map((e) => e.message).join('; ');
      throw new Error(
        `Fix applied but resulted in definition errors: ${messages}`,
      );
    }

    session.draftDefinition = fixedSerializedDefinition;
    await saveDraftSession(projectDirectory, session);

    return {
      message: `Applied fix: ${matchingIssue.fix?.label ?? matchingIssue.message}`,
      issues: warnings.length > 0 ? warnings.map(mapIssueToOutput) : undefined,
    };
  },
  writeCliOutput: (output) => {
    console.info(`✓ ${output.message}`);
    if (output.issues) {
      for (const issue of output.issues) {
        console.warn(`  ⚠ ${issue.message}`);
      }
    }
  },
});
