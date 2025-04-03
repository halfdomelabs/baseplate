import { describe, expect, it } from 'vitest';

import { sortTaskPhases } from './sort-task-phases.js';
import { createTaskPhase } from './types.js';

describe('sortTaskPhases', () => {
  it('should sort phases in correct order based on dependencies', () => {
    const phaseA = createTaskPhase('A');
    const phaseB = createTaskPhase('B', {
      consumesOutputFrom: [phaseA],
    });
    const phaseC = createTaskPhase('C', {
      consumesOutputFrom: [phaseB],
    });

    const sorted = sortTaskPhases([phaseC, phaseA, phaseB]);
    expect(sorted.map((p) => p.name)).toEqual(['A', 'B', 'C']);
  });

  it('should handle phases with multiple dependencies', () => {
    const phaseA = createTaskPhase('A');
    const phaseB = createTaskPhase('B');
    const phaseC = createTaskPhase('C', {
      consumesOutputFrom: [phaseA, phaseB],
    });

    const sorted = sortTaskPhases([phaseC, phaseA, phaseB]);
    expect(sorted.map((p) => p.name)).toEqual(['A', 'B', 'C']);
  });

  it('should handle phases with addsDynamicTasksTo relationships', () => {
    const phaseA = createTaskPhase('A');
    const phaseB = createTaskPhase('B', {
      addsDynamicTasksTo: [phaseA],
    });
    const phaseC = createTaskPhase('C', {
      consumesOutputFrom: [phaseA],
    });

    const sorted = sortTaskPhases([phaseC, phaseA, phaseB]);
    expect(sorted.map((p) => p.name)).toEqual(['B', 'A', 'C']);
  });

  it('should throw error when duplicate phase names are found', () => {
    const phaseA1 = createTaskPhase('A');
    const phaseA2 = createTaskPhase('A');

    expect(() => sortTaskPhases([phaseA1, phaseA2])).toThrow(
      'Duplicate phase name found: A',
    );
  });

  it('should throw error when referenced phase is not found', () => {
    const phaseA = createTaskPhase('A');
    const phaseB = createTaskPhase('B', {
      consumesOutputFrom: [phaseA],
    });

    expect(() => sortTaskPhases([phaseB])).toThrow(
      'Dependency phase A not found in phases',
    );
  });

  it('should handle independent phases', () => {
    const phaseA = createTaskPhase('A');
    const phaseB = createTaskPhase('B');
    const phaseC = createTaskPhase('C');

    const sorted = sortTaskPhases([phaseA, phaseB, phaseC]);
    expect(sorted.map((p) => p.name)).toEqual(['A', 'B', 'C']);
  });

  it('should handle complex dependency graph', () => {
    const phaseA = createTaskPhase('A');
    const phaseB = createTaskPhase('B', {
      consumesOutputFrom: [phaseA],
    });
    const phaseC = createTaskPhase('C', {
      consumesOutputFrom: [phaseA],
    });
    const phaseD = createTaskPhase('D', {
      consumesOutputFrom: [phaseB, phaseC],
    });

    const sorted = sortTaskPhases([phaseD, phaseB, phaseC, phaseA]);
    expect(sorted.map((p) => p.name)).toEqual(['A', 'B', 'C', 'D']);
  });
});
