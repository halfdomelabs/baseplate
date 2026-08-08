import { createServiceAction } from '#src/actions/types.js';

import { getProjectByNameOrId } from '../utils/projects.js';
import { discardDraftMetadata } from './discard-draft.action-metadata.js';
import { deleteDraftSession, loadDraftSession } from './draft-session.js';

export const discardDraftAction = createServiceAction({
  ...discardDraftMetadata,
  handler: async (input, context) => {
    const project = getProjectByNameOrId(context.projects, input.project);

    const session = await loadDraftSession(project.directory);
    if (!session) {
      return { message: 'No draft session to discard.' };
    }

    await deleteDraftSession(project.directory);

    return { message: 'Draft session discarded.' };
  },
  writeCliOutput: (output) => {
    console.info(`✓ ${output.message}`);
  },
});
