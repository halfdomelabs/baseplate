import { patchEntity } from '@baseplate-dev/project-builder-lib';

import { createServiceAction } from '#src/actions/types.js';

import { getOrCreateDraftSession } from './draft-session.js';
import { assertEntityTypeNotBlacklisted } from './entity-type-blacklist.js';
import { stagePatchEntityMetadata } from './stage-patch-entity.action-metadata.js';
import {
  mapIssueToOutput,
  validateAndSaveDraft,
  writeIssuesCliOutput,
} from './validate-draft.js';

export const stagePatchEntityAction = createServiceAction({
  ...stagePatchEntityMetadata,
  handler: async (input, context) => {
    assertEntityTypeNotBlacklisted(input.entityTypeName);

    const {
      session,
      entityContext,
      oldRefPayload,
      parserContext,
      projectDirectory,
    } = await getOrCreateDraftSession(input.project, context);

    const newDefinition = patchEntity(
      {
        entityTypeName: input.entityTypeName,
        entityId: input.entityId,
        entityData: input.entityData,
      },
      entityContext,
    );

    const { warnings } = await validateAndSaveDraft(
      newDefinition,
      parserContext,
      session,
      projectDirectory,
      undefined,
      oldRefPayload,
    );

    return {
      message: `Staged patch of ${input.entityTypeName} entity "${input.entityId}". Use commit-draft to persist.`,
      issues: warnings.length > 0 ? warnings.map(mapIssueToOutput) : undefined,
    };
  },
  writeCliOutput: writeIssuesCliOutput,
});
