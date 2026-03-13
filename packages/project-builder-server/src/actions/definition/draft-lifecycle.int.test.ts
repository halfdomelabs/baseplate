import {
  createTestFeature,
  createTestModel,
  createTestRelationField,
  createTestScalarField,
} from '@baseplate-dev/project-builder-lib/testing';
import { vol } from 'memfs';
import { readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, vi } from 'vitest';

import type { DraftSessionContext } from './draft-session.js';

import {
  createTestEntityServiceContext,
  invokeServiceActionForTest,
} from '../__tests__/action-test-utils.js';
import { applyFixAction } from './apply-fix.action.js';
import { commitDraftAction } from './commit-draft.action.js';
import { test } from './definition-test-fixtures.test-helper.js';
import { discardDraftAction } from './discard-draft.action.js';
import {
  getOrCreateDraftSession,
  loadDefinitionHash,
} from './draft-session.js';
import { showDraftAction } from './show-draft.action.js';
import { stageCreateEntityAction } from './stage-create-entity.action.js';

vi.mock('./load-entity-service-context.js');
vi.mock('node:fs/promises');

vi.mock('./draft-session.js', async () => {
  const actual = await vi.importActual('./draft-session.js');
  return {
    ...actual,
    getOrCreateDraftSession: vi.fn(),
    loadDefinitionHash: vi.fn(),
  };
});

vi.mock('#src/plugins/node-plugin-store.js', () => ({
  createNodeSchemaParserContext: vi.fn(),
}));

beforeEach(() => {
  vol.reset();
  vi.mocked(loadDefinitionHash).mockResolvedValue('test-hash');
});

describe('draft lifecycle', () => {
  test('stage → show-draft → commit', async ({
    context,
    projectDir,
    parserContext,
  }) => {
    const { createNodeSchemaParserContext } =
      await import('#src/plugins/node-plugin-store.js');
    vi.mocked(createNodeSchemaParserContext).mockResolvedValue(parserContext);

    // 1. Stage a new feature
    const stageResult = await invokeServiceActionForTest(
      stageCreateEntityAction,
      {
        project: 'test-project',
        entityTypeName: 'feature',
        entityData: { name: 'payments' },
      },
      context,
    );
    expect(stageResult.message).toContain('Staged creation');

    // 2. Show draft — should reflect the staged change
    const showResult = await invokeServiceActionForTest(
      showDraftAction,
      { project: 'test-project' },
      context,
    );
    expect(showResult.hasDraft).toBe(true);
    expect(showResult.sessionId).toBe('default');
    const { changes } = showResult;
    expect(changes).toBeDefined();
    expect(changes?.length).toBeGreaterThan(0);

    const addedFeature = changes?.find(
      (c: { label: string; type: string }) =>
        c.type === 'added' && c.label.includes('payments'),
    );
    expect(addedFeature).toBeDefined();

    // 3. Commit the draft
    const commitResult = await invokeServiceActionForTest(
      commitDraftAction,
      { project: 'test-project' },
      context,
    );
    expect(commitResult.message).toContain('committed successfully');

    // 4. Verify project-definition.json was written
    const defContents = await readFile(
      `${projectDir}/baseplate/project-definition.json`,
      'utf-8',
    );
    expect(defContents).toBeDefined();
    expect(defContents.length).toBeGreaterThan(0);

    // 5. Verify draft session files are cleaned up
    await expect(
      readFile(`${projectDir}/baseplate/.build/draft-session.json`, 'utf-8'),
    ).rejects.toThrow();
  });

  test('stage → apply-fix → verify fix applied', async ({
    context,
    projectDir,
  }) => {
    // Build fixtures with a relation type mismatch:
    // User.id is uuid, Post.userId is int — mismatch that produces a fixable warning
    const feature = createTestFeature({ name: 'core' });
    const userModel = createTestModel({
      name: 'User',
      featureRef: feature.name,
      model: {
        fields: [
          createTestScalarField({
            name: 'id',
            type: 'uuid',
            options: { genUuid: true },
          }),
        ],
        primaryKeyFieldRefs: ['id'],
      },
    });
    const postModel = createTestModel({
      name: 'Post',
      featureRef: feature.name,
      model: {
        fields: [
          createTestScalarField({
            name: 'id',
            type: 'uuid',
            options: { genUuid: true },
          }),
          createTestScalarField({ name: 'userId', type: 'int' }),
        ],
        primaryKeyFieldRefs: ['id'],
        relations: [
          createTestRelationField({
            name: 'user',
            modelRef: 'User',
            references: [{ localRef: 'userId', foreignRef: 'id' }],
          }),
        ],
      },
    });

    const mismatchContext = createTestEntityServiceContext({
      features: [feature],
      models: [userModel, postModel],
    });

    const draftSessionContext: DraftSessionContext = {
      session: {
        sessionId: 'default',
        definitionHash: 'test-hash',
        draftDefinition: mismatchContext.entityContext.serializedDefinition,
      },
      entityContext: mismatchContext.entityContext,
      parserContext: mismatchContext.parserContext,
      projectDirectory: '/test-project',
    };
    vi.mocked(getOrCreateDraftSession).mockResolvedValue(draftSessionContext);

    // 1. Stage a feature — triggers validation which should detect the mismatch
    const stageResult = await invokeServiceActionForTest(
      stageCreateEntityAction,
      {
        project: 'test-project',
        entityTypeName: 'feature',
        entityData: { name: 'payments' },
      },
      context,
    );
    expect(stageResult.message).toContain('Staged creation');
    expect(stageResult.issues).toBeDefined();

    // Find the relation type mismatch warning with a fix
    const mismatchIssue = stageResult.issues?.find(
      (issue: { fixId?: string; message: string }) =>
        issue.fixId && issue.message.includes('type mismatch'),
    );
    if (!mismatchIssue?.fixId) {
      throw new Error('Expected a fixable type mismatch issue');
    }
    expect(mismatchIssue.fixLabel).toContain("Change 'userId' type to 'uuid'");

    // 2. Apply the fix
    const fixResult = await invokeServiceActionForTest(
      applyFixAction,
      { project: 'test-project', fixId: mismatchIssue.fixId },
      context,
    );
    expect(fixResult.message).toContain('Applied fix');

    // 3. Verify the fix was applied — userId should now be uuid
    const defContents = await readFile(
      `${projectDir}/baseplate/.build/draft-definition.json`,
      'utf-8',
    );
    const definition = JSON.parse(defContents) as {
      models: {
        name: string;
        model: { fields: { name: string; type: string }[] };
      }[];
    };
    const post = definition.models.find((m) => m.name === 'Post');
    const userIdField = post?.model.fields.find((f) => f.name === 'userId');
    expect(userIdField?.type).toBe('uuid');
  });

  test('stage → discard', async ({ context, projectDir }) => {
    // 1. Stage a change
    await invokeServiceActionForTest(
      stageCreateEntityAction,
      {
        project: 'test-project',
        entityTypeName: 'feature',
        entityData: { name: 'payments' },
      },
      context,
    );

    // Verify draft files exist
    const sessionContents = await readFile(
      `${projectDir}/baseplate/.build/draft-session.json`,
      'utf-8',
    );
    expect(sessionContents).toBeDefined();

    // 2. Discard
    const discardResult = await invokeServiceActionForTest(
      discardDraftAction,
      { project: 'test-project' },
      context,
    );
    expect(discardResult.message).toContain('discarded');

    // 3. Verify draft session files are deleted
    await expect(
      readFile(`${projectDir}/baseplate/.build/draft-session.json`, 'utf-8'),
    ).rejects.toThrow();
  });

  test('discard with no draft', async ({ context }) => {
    const result = await invokeServiceActionForTest(
      discardDraftAction,
      { project: 'test-project' },
      context,
    );

    expect(result.message).toContain('No draft session to discard');
  });
});
