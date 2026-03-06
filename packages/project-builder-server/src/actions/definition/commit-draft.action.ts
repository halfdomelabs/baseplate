import {
  collectDefinitionIssues,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';
import { resolveBaseplateDir } from '#src/diff/snapshot/snapshot-utils.js';
import { createNodeSchemaParserContext } from '#src/plugins/node-plugin-store.js';

import { getProjectByNameOrId } from '../utils/projects.js';
import {
  deleteDraftSession,
  loadDefinitionHash,
  loadDraftSession,
} from './draft-session.js';
import { definitionIssueSchema } from './validate-draft.js';

const commitDraftInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
});

const commitDraftOutputSchema = z.object({
  message: z.string().describe('A summary of the commit result.'),
  issues: z
    .array(definitionIssueSchema)
    .optional()
    .describe('Definition issues that blocked the commit.'),
});

export const commitDraftAction = createServiceAction({
  name: 'commit-draft',
  title: 'Commit Draft',
  description:
    'Commit the staged draft changes to the project-definition.json file.',
  inputSchema: commitDraftInputSchema,
  outputSchema: commitDraftOutputSchema,
  handler: async (input, context) => {
    const project = getProjectByNameOrId(context.projects, input.project);

    const session = await loadDraftSession(project.directory);
    if (!session) {
      throw new Error(
        'No draft session found. Stage changes first with stage-create-entity, stage-update-entity, or stage-delete-entity.',
      );
    }

    // Verify the definition hasn't changed since the draft was created
    const currentHash = await loadDefinitionHash(project.directory);
    if (currentHash !== session.definitionHash) {
      throw new Error(
        'The project definition has changed since the draft was created. ' +
          'Discard the draft with discard-draft and start over.',
      );
    }

    // Convert the serialized draft back to a proper definition and serialize it
    const parserContext = await createNodeSchemaParserContext(
      project,
      context.logger,
      context.plugins,
      context.cliVersion,
    );

    const container = ProjectDefinitionContainer.fromSerializedConfig(
      session.draftDefinition,
      parserContext,
    );

    // Validate the draft definition before committing
    const issues = collectDefinitionIssues(
      container.schema,
      container.definition,
      container.pluginStore,
    );

    if (issues.length > 0) {
      const messages = issues
        .map((i) => `[${i.severity}] ${i.message}`)
        .join('; ');
      throw new Error(`Commit blocked by definition issues: ${messages}`);
    }

    const serializedContents = container.toSerializedContents();

    // Write to project-definition.json
    const baseplateDir = resolveBaseplateDir(project.directory);
    const projectJsonPath = path.join(baseplateDir, 'project-definition.json');
    await writeFile(projectJsonPath, serializedContents, 'utf-8');

    // Clean up draft session
    await deleteDraftSession(project.directory);

    return {
      message: 'Draft committed successfully to project-definition.json.',
    };
  },
  writeCliOutput: (output) => {
    console.info(`✓ ${output.message}`);
  },
});
