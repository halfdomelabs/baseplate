import {
  collectDefinitionIssues,
  createIssueFixSetter,
  ProjectDefinitionContainer,
  serializeSchema,
} from '@baseplate-dev/project-builder-lib';
import { produce } from 'immer';

import { createServiceAction } from '#src/actions/types.js';

import { applyFixMetadata } from './apply-fix.action-metadata.js';
import { getOrCreateDraftSession } from './draft-session.js';
import {
  generateFixId,
  mapIssueToOutput,
  validateAndSaveDraft,
  writeIssuesCliOutput,
} from './validate-draft.js';

export const applyFixAction = createServiceAction({
  ...applyFixMetadata,
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

    const { warnings } = await validateAndSaveDraft(
      fixedSerializedDef,
      parserContext,
      session,
      projectDirectory,
      'Fix applied but resulted in definition errors',
    );

    return {
      message: `Applied fix: ${matchingIssue.fix?.label ?? matchingIssue.message}`,
      issues: warnings.length > 0 ? warnings.map(mapIssueToOutput) : undefined,
    };
  },
  writeCliOutput: writeIssuesCliOutput,
});
