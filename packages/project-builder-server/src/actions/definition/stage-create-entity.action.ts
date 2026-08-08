import { createEntity } from '@baseplate-dev/project-builder-lib';

import { createServiceAction } from '#src/actions/types.js';

import { getOrCreateDraftSession } from './draft-session.js';
import { assertEntityTypeNotBlacklisted } from './entity-type-blacklist.js';
import { stageCreateEntityMetadata } from './stage-create-entity.action-metadata.js';
import {
  mapIssueToOutput,
  validateAndSaveDraft,
  writeIssuesCliOutput,
} from './validate-draft.js';

export const stageCreateEntityAction = createServiceAction({
  ...stageCreateEntityMetadata,
  handler: async (input, context) => {
    assertEntityTypeNotBlacklisted(input.entityTypeName);

    const { session, entityContext, parserContext, projectDirectory } =
      await getOrCreateDraftSession(input.project, context);

    const newDefinition = createEntity(
      {
        entityTypeName: input.entityTypeName,
        entityData: input.entityData,
        parentEntityId: input.parentEntityId,
      },
      entityContext,
    );

    const { warnings } = await validateAndSaveDraft(
      newDefinition,
      parserContext,
      session,
      projectDirectory,
    );

    return {
      message: `Staged creation of ${input.entityTypeName} entity. Use commit-draft to persist.`,
      issues: warnings.length > 0 ? warnings.map(mapIssueToOutput) : undefined,
    };
  },
  writeCliOutput: writeIssuesCliOutput,
});
