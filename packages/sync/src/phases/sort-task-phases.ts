import { toposortOrdered } from '@baseplate-dev/utils';

import type { TaskPhase } from './types.js';

export function sortTaskPhases(phases: TaskPhase[]): TaskPhase[] {
  // Check for duplicate phase names
  const phaseNames = new Set<string>();
  for (const phase of phases) {
    if (phaseNames.has(phase.name)) {
      throw new Error(`Duplicate phase name found: ${phase.name}`);
    }
    phaseNames.add(phase.name);
  }

  // Build dependency graph
  const nodes = phases.map((phase) => phase.name);
  const edges: [string, string][] = [];
  const phaseMap = new Map<string, TaskPhase>();

  // First pass: create phase map
  for (const phase of phases) {
    phaseMap.set(phase.name, phase);
  }

  // Second pass: build edges
  for (const phase of phases) {
    // Add edges for phases that must complete before this phase
    if (phase.options.consumesOutputFrom) {
      for (const dependency of phase.options.consumesOutputFrom) {
        if (!nodes.includes(dependency.name)) {
          throw new Error(
            `Dependency phase ${dependency.name} not found in phases`,
          );
        }
        edges.push([dependency.name, phase.name]);
      }
    }

    // Add edges for phases that must occur after this phase
    if (phase.options.addsDynamicTasksTo) {
      for (const dependent of phase.options.addsDynamicTasksTo) {
        if (!nodes.includes(dependent.name)) {
          throw new Error(
            `Dependent phase ${dependent.name} not found in phases`,
          );
        }
        edges.push([phase.name, dependent.name]);
      }
    }
  }

  // Perform topological sort
  const sortedNames = toposortOrdered(nodes, edges);

  // Convert sorted names back to phases
  return sortedNames.map((name) => {
    const phase = phaseMap.get(name);
    if (!phase) {
      throw new Error(`Phase ${name} not found in phase map`);
    }
    return phase;
  });
}
