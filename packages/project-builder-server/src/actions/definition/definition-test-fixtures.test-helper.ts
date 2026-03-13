import type {
  ModelConfig,
  SchemaParserContext,
} from '@baseplate-dev/project-builder-lib';

import {
  createTestFeature,
  createTestModel,
  createTestScalarField,
} from '@baseplate-dev/project-builder-lib/testing';
import { test as baseTest, vi } from 'vitest';

import type { ServiceActionContext } from '#src/actions/types.js';

import type { TestEntityServiceContextResult } from '../__tests__/action-test-utils.js';
import type { DraftSessionContext } from './draft-session.js';

import {
  createTestActionContext,
  createTestEntityServiceContext,
} from '../__tests__/action-test-utils.js';
import { getOrCreateDraftSession } from './draft-session.js';
import { loadEntityServiceContext } from './load-entity-service-context.js';

// -- Test data builders -------------------------------------------------------

function buildTestData(): {
  blogPostModel: ModelConfig;
  testEntityServiceContext: TestEntityServiceContextResult;
} {
  const blogFeature = createTestFeature({ name: 'blog' });

  const blogPostModel = createTestModel({
    name: 'BlogPost',
    featureRef: blogFeature.name,
    model: {
      fields: [
        createTestScalarField({
          name: 'id',
          type: 'uuid',
          options: { genUuid: true },
        }),
        createTestScalarField({ name: 'title', type: 'string' }),
        createTestScalarField({ name: 'content', type: 'string' }),
      ],
      primaryKeyFieldRefs: ['id'],
    },
  });

  const testEntityServiceContext = createTestEntityServiceContext({
    features: [blogFeature],
    models: [blogPostModel],
  });

  return { blogPostModel, testEntityServiceContext };
}

// -- Custom test with fixtures ------------------------------------------------

/**
 * Custom test function that injects definition action fixtures.
 *
 * Each test file must still declare `vi.mock()` calls at the top level
 * (they are hoisted). This fixture handles the per-test mock setup.
 */
interface TestData {
  blogPostModel: ModelConfig;
  testEntityServiceContext: TestEntityServiceContextResult;
}

export const test = baseTest.extend<{
  testData: TestData;
  context: ServiceActionContext;
  blogPostModel: ModelConfig;
  testEntityServiceContext: TestEntityServiceContextResult;
  parserContext: SchemaParserContext;
  projectDir: string;
}>({
  testData: async ({}, use) => {
    await use(buildTestData());
  },
  blogPostModel: async ({ testData }, use) => {
    await use(testData.blogPostModel);
  },
  testEntityServiceContext: async ({ testData }, use) => {
    await use(testData.testEntityServiceContext);
  },
  parserContext: async ({ testEntityServiceContext }, use) => {
    await use(testEntityServiceContext.parserContext);
  },
  projectDir: async ({}, use) => {
    await use('/test-project');
  },
  context: async ({ testEntityServiceContext }, use) => {
    const ctx = createTestActionContext();

    const draftSessionContext: DraftSessionContext = {
      session: {
        sessionId: 'default',
        definitionHash: 'test-hash',
        draftDefinition:
          testEntityServiceContext.entityContext.serializedDefinition,
      },
      entityContext: testEntityServiceContext.entityContext,
      parserContext: testEntityServiceContext.parserContext,
      projectDirectory: '/test-project',
    };

    vi.mocked(loadEntityServiceContext).mockResolvedValue(
      testEntityServiceContext,
    );
    vi.mocked(getOrCreateDraftSession).mockResolvedValue(draftSessionContext);

    await use(ctx);
  },
});
