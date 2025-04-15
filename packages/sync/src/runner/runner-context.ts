import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Structure representing the context of a generator runner
 */
interface RunnerContext {
  /** The ID of the task being executed */
  taskId: string;
}

// Create the AsyncLocalStorage instance for the runner context
const runnerContextStorage = new AsyncLocalStorage<RunnerContext>();

/**
 * Runs a function within a generator runner context
 *
 * @param context The runner context
 * @param fn The function to run within the context
 * @returns The result of the function
 */
export function runInRunnerContext<T>(context: RunnerContext, fn: () => T): T {
  return runnerContextStorage.run(context, fn);
}

/**
 * Gets the current runner context if it exists.
 *
 * Note: This should only be used for debugging purposes and not part of the main flow
 * to allow for more effective testing.
 *
 * @returns The current runner context or undefined if not in a context
 */
export function getRunnerContext(): RunnerContext | undefined {
  return runnerContextStorage.getStore();
}
