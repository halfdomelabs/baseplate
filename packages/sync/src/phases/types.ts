/**
 * The options for a task phase
 */
export interface TaskPhaseOptions {
  /**
   * The phases that must complete before this phase
   */
  consumesOutputFrom?: TaskPhase[];
  /**
   * The phases that must occur after this phase
   */
  addsDynamicTasksTo?: TaskPhase[];
}

/**
 * A task phase
 */
export interface TaskPhase {
  name: string;
  options: TaskPhaseOptions;
}

/**
 * Create a new task phase
 * @param name - The name of the phase
 * @param options - The options for the phase
 * @returns The new task phase
 */
export function createTaskPhase(
  name: string,
  options?: TaskPhaseOptions,
): TaskPhase {
  return {
    name,
    options: options ?? {},
  };
}
