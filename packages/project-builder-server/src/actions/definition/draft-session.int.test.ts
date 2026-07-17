import {
  createTestFeature,
  createTestModel,
  createTestProjectDefinitionContainer,
  createTestScalarField,
} from '@baseplate-dev/project-builder-lib/testing';
import { stringifyPrettyStable } from '@baseplate-dev/utils';
import { vol } from 'memfs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestActionContext } from '../__tests__/action-test-utils.js';
import { getOrCreateDraftSession, loadDraftSession } from './draft-session.js';

vi.mock('node:fs/promises');

vi.mock('#src/plugins/node-plugin-store.js', () => ({
  createNodeSchemaParserContext: vi.fn(),
}));

const PROJECT_DIR = '/test-project';
const BASEPLATE_DIR = `${PROJECT_DIR}/baseplate`;
const BUILD_DIR = `${BASEPLATE_DIR}/.build`;

/**
 * Builds a plugin-free project definition + its parser context, writes the
 * serialized definition to disk, and points the mocked parser-context factory
 * at the in-memory container's context.
 */
async function seedProject(): Promise<void> {
  const container = createTestProjectDefinitionContainer({
    features: [createTestFeature({ name: 'core' })],
    models: [
      createTestModel({
        name: 'User',
        featureRef: 'core',
        model: {
          fields: [
            createTestScalarField({
              name: 'id',
              type: 'uuid',
              options: { defaultGeneration: 'uuidv7' },
            }),
          ],
          primaryKeyFieldRefs: ['id'],
        },
      }),
    ],
  });

  await mkdir(BASEPLATE_DIR, { recursive: true });
  await writeFile(
    `${BASEPLATE_DIR}/project-definition.json`,
    container.toSerializedContents(),
  );

  const { createNodeSchemaParserContext } =
    await import('#src/plugins/node-plugin-store.js');
  vi.mocked(createNodeSchemaParserContext).mockResolvedValue(
    container.parserContext,
  );
}

/** Writes a draft session whose draft definition has all model ids stripped. */
async function writeCorruptDraft(): Promise<void> {
  const container = createTestProjectDefinitionContainer({
    features: [createTestFeature({ name: 'core' })],
    models: [
      createTestModel({
        name: 'User',
        featureRef: 'core',
        model: {
          fields: [
            createTestScalarField({
              name: 'id',
              type: 'uuid',
              options: { defaultGeneration: 'uuidv7' },
            }),
          ],
          primaryKeyFieldRefs: ['id'],
        },
      }),
    ],
  });
  const draftDefinition = structuredClone(
    container.toEntityServiceContext().serializedDefinition,
  ) as { models?: { id?: string }[] };
  // Simulate a draft written by an older/buggy CLI: drop entity ids.
  for (const model of draftDefinition.models ?? []) {
    delete model.id;
  }

  const definitionHash = 'unused-hash';
  await mkdir(BUILD_DIR, { recursive: true });
  await writeFile(
    `${BUILD_DIR}/draft-session.json`,
    stringifyPrettyStable({ sessionId: 'default', definitionHash }),
  );
  await writeFile(
    `${BUILD_DIR}/draft-definition.json`,
    stringifyPrettyStable(draftDefinition),
  );
}

beforeEach(() => {
  vol.reset();
});

describe('getOrCreateDraftSession corrupt-draft recovery', () => {
  it('throws an actionable error when the persisted draft cannot be parsed', async () => {
    await seedProject();

    // Force the draft hash to match the on-disk definition hash so we reach the
    // parse step (not the "definition changed" guard).
    const projectJson = await readFile(
      `${BASEPLATE_DIR}/project-definition.json`,
      'utf-8',
    );
    const { hashWithSHA256 } = await import('@baseplate-dev/utils');
    const hash = await hashWithSHA256(projectJson);
    await writeCorruptDraft();
    await writeFile(
      `${BUILD_DIR}/draft-session.json`,
      stringifyPrettyStable({ sessionId: 'default', definitionHash: hash }),
    );

    const context = createTestActionContext({
      projects: [
        {
          id: 'test-project',
          name: 'test-project',
          directory: PROJECT_DIR,
          baseplateDirectory: BASEPLATE_DIR,
          type: 'user',
        },
      ],
    });

    await expect(
      getOrCreateDraftSession('test-project', context),
    ).rejects.toThrow(/corrupt.*discard-draft/is);
  });

  it('discard-draft can clear a corrupt draft (loadDraftSession does not schema-parse the draft)', async () => {
    await seedProject();
    await writeCorruptDraft();

    // loadDraftSession only JSON-parses; it must not throw on a corrupt draft,
    // so discard-draft can always remove it.
    const session = await loadDraftSession(PROJECT_DIR);
    expect(session).not.toBeNull();
    expect(session?.sessionId).toBe('default');
  });
});
