import type {
  ProjectDefinitionInput,
  SchemaParserContext,
} from '@baseplate-dev/project-builder-lib';
import type z from 'zod';

import { createTestProjectDefinitionContainer } from '@baseplate-dev/project-builder-lib/testing';
import { createConsoleLogger } from '@baseplate-dev/sync';

import type {
  ServiceAction,
  ServiceActionContext,
} from '#src/actions/types.js';

import type { EntityServiceContextResult } from '../definition/load-entity-service-context.js';

/**
 * Creates a minimal ServiceActionContext for testing.
 *
 * @param overrides - Partial overrides for context properties.
 * @returns A ServiceActionContext with sensible test defaults.
 */
export function createTestActionContext(
  overrides: Partial<ServiceActionContext> = {},
): ServiceActionContext {
  return {
    projects: [
      {
        id: 'test-project',
        name: 'test-project',
        directory: '/test-project',
        baseplateDirectory: '/test-project/baseplate',
        type: 'user',
      },
    ],
    plugins: [],
    userConfig: {},
    logger: createConsoleLogger('warn'),
    cliVersion: '0.0.0-test',
    sessionId: 'default',
    ...overrides,
  };
}

/**
 * Creates a test EntityServiceContext from a partial project definition input.
 *
 * Uses `createTestProjectDefinitionContainer` to build the container in-memory,
 * then converts it to an EntityServiceContext. No file I/O required.
 *
 * @param input - Partial ProjectDefinitionInput to customise the test definition.
 * @returns An EntityServiceContextResult matching the shape returned by `loadEntityServiceContext`.
 */
export interface TestEntityServiceContextResult extends EntityServiceContextResult {
  parserContext: SchemaParserContext;
}

export function createTestEntityServiceContext(
  input: Partial<ProjectDefinitionInput> = {},
): TestEntityServiceContextResult {
  const container = createTestProjectDefinitionContainer(input);
  const entityContext = container.toEntityServiceContext();
  return { entityContext, container, parserContext: container.parserContext };
}

/**
 * Invokes a service action for testing, validating input/output schemas
 * but skipping CLI output formatting.
 */
export async function invokeServiceActionForTest<
  TInputType extends z.ZodType,
  TOutputType extends z.ZodType,
>(
  action: ServiceAction<TInputType, TOutputType>,
  input: z.input<TInputType>,
  context: ServiceActionContext,
): Promise<z.output<TOutputType>> {
  const parsedInput = action.inputSchema.parse(input);
  const result = await action.handler(parsedInput, context);
  return action.outputSchema.parse(result);
}
