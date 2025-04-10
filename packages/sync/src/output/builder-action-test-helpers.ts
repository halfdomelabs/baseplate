import type { BuilderAction } from './builder-action.js';
import type {
  GeneratorTaskOutput,
  GeneratorTaskOutputBuilderContext,
} from './generator-task-output.js';

import { GeneratorTaskOutputBuilder } from './generator-task-output.js';

/**
 * Creates a test task output builder
 *
 * @param context - The context to use for the builder
 * @returns The builder
 */
export function createTestTaskOutputBuilder(
  context: Partial<GeneratorTaskOutputBuilderContext> = {},
): GeneratorTaskOutputBuilder {
  return new GeneratorTaskOutputBuilder({
    generatorInfo: {
      name: 'test-generator',
      baseDirectory: '/root/pkg/test-generator',
    },
    generatorId: 'test-generator-id',
    ...context,
  });
}

/**
 * Tests an action
 *
 * @param action - The action to test
 * @param context - The context to use for the builder
 * @returns The output of the builder
 */
export async function testAction(
  action: BuilderAction,
  context?: Partial<GeneratorTaskOutputBuilderContext>,
): Promise<GeneratorTaskOutput> {
  const builder = createTestTaskOutputBuilder(context);
  await action.execute(builder);
  return builder.output;
}
