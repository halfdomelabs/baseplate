import type { DefinitionDiffEntry } from '@baseplate-dev/project-builder-lib';

import { diffSerializedDefinitions } from '@baseplate-dev/project-builder-lib';
import { stringifyPrettyStable } from '@baseplate-dev/utils';
import jsonPatch from 'fast-json-patch';

import { createServiceAction } from '#src/actions/types.js';

import { getProjectByNameOrId } from '../utils/projects.js';
import { loadDraftSession } from './draft-session.js';
import { loadEntityServiceContext } from './load-entity-service-context.js';
import { showDraftMetadata } from './show-draft.action-metadata.js';

const MAX_DETAILS_LENGTH = 2000;
function truncateDetails(text: string): string {
  if (text.length <= MAX_DETAILS_LENGTH) {
    return text;
  }
  return `${text.slice(0, MAX_DETAILS_LENGTH)}\n... (truncated)`;
}
function formatChangeDetails(entry: DefinitionDiffEntry): string | null {
  switch (entry.type) {
    case 'added': {
      const json = stringifyPrettyStable(entry.merged as object);
      return truncateDetails(json);
    }
    case 'updated': {
      const operations = jsonPatch.compare(
        entry.current as object,
        entry.merged as object,
      );
      const json = stringifyPrettyStable(operations);
      return truncateDetails(json);
    }
    case 'removed': {
      return null;
    }
  }
}

export const showDraftAction = createServiceAction({
  ...showDraftMetadata,
  handler: async (input, context) => {
    const project = getProjectByNameOrId(context.projects, input.project);

    const session = await loadDraftSession(project.directory);
    if (!session) {
      return {
        hasDraft: false,
        sessionId: null,
        definitionHash: null,
        changes: null,
      };
    }

    // Load the current definition to diff against
    const { container } = await loadEntityServiceContext(
      input.project,
      context,
    );
    const currentEntityContext = container.toEntityServiceContext();

    const diff = diffSerializedDefinitions(
      container.schema,
      currentEntityContext.serializedDefinition,
      session.draftDefinition,
    );

    return {
      hasDraft: true,
      sessionId: session.sessionId,
      definitionHash: session.definitionHash,
      changes: diff.entries.map((entry) => ({
        label: entry.label,
        type: entry.type,
        details: formatChangeDetails(entry),
      })),
    };
  },
  writeCliOutput: (output) => {
    if (!output.hasDraft) {
      console.info('No draft session.');
      return;
    }
    console.info(`Draft session: ${output.sessionId}`);
    console.info(`Definition hash: ${output.definitionHash}`);

    if (!output.changes || output.changes.length === 0) {
      console.info('No changes.');
      return;
    }

    console.info('Changes:');
    for (const change of output.changes) {
      const prefix =
        change.type === 'added' ? '+' : change.type === 'removed' ? '-' : '~';
      console.info(`  ${prefix} ${change.label} (${change.type})`);
      if (change.details) {
        const indented = change.details
          .split('\n')
          .map((line) => `    ${line}`)
          .join('\n');
        console.info(indented);
      }
    }
  },
});
