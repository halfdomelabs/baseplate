import type { GeneratorTaskOutputBuilder } from './generator-task-output.js';

/**
 * An action to apply to the builder such as writing a formatted file
 */
export interface BuilderAction {
  execute(builder: GeneratorTaskOutputBuilder): void | Promise<void>;
}

/**
 * A function that creates a builder action
 */
export type BuilderActionCreator<T extends unknown[]> = (
  ...args: T
) => BuilderAction;

/**
 * Creates a builder action creator
 *
 * @param creator The function that creates the builder action
 * @returns The builder action creator
 */
export function createBuilderActionCreator<T extends unknown[]>(
  creator: (...args: T) => BuilderAction['execute'],
): BuilderActionCreator<T> {
  return (...args) => ({
    execute: (builder) => creator(...args)(builder),
  });
}
