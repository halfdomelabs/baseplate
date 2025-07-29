import { describe, expect, it } from 'vitest';

import {
  ToposortCyclicalDependencyError,
  ToposortUnknownNodeError,
} from './errors.js';
import { toposort } from './toposort.js';

describe('toposort', () => {
  // Helper to check if dependencies are met in the sorted output
  const expectOrder = <T>(sorted: T[], edges: [T, T][]): void => {
    const positions = new Map<T, number>();
    for (const [index, node] of sorted.entries()) positions.set(node, index);

    for (const [source, target] of edges) {
      const sourcePos = positions.get(source);
      const targetPos = positions.get(target);
      // Check if both nodes are in the sorted output before comparing positions
      // (Handles cases where edges might involve nodes not in the primary 'nodes' list,
      // although our makeOutgoingEdges prevents this)
      if (sourcePos !== undefined && targetPos !== undefined) {
        expect(
          sourcePos,
          `Dependency violated: ${JSON.stringify(source)} should come before ${JSON.stringify(target)}`,
        ).toBeLessThan(targetPos);
      } else {
        // This case should ideally not be reached if input validation is correct
        if (!positions.has(source))
          throw new Error(
            `Source node ${JSON.stringify(source)} not found in sorted output`,
          );
        if (!positions.has(target))
          throw new Error(
            `Target node ${JSON.stringify(target)} not found in sorted output`,
          );
      }
    }
  };

  it('should return an empty array for an empty graph', () => {
    expect(toposort([], [])).toEqual([]);
  });

  it('should return the single node for a graph with one node', () => {
    expect(toposort(['a'], [])).toEqual(['a']);
    expect(toposort([1], [])).toEqual([1]);
  });

  it('should sort nodes in a simple linear chain', () => {
    const nodes = ['a', 'b', 'c'];
    const edges: [string, string][] = [
      ['a', 'b'],
      ['b', 'c'],
    ];
    const sorted = toposort(nodes, edges);
    expect(sorted).toEqual(['a', 'b', 'c']);
    expectOrder(sorted, edges);
  });

  it('should sort nodes in a simple linear chain (numbers)', () => {
    const nodes = [1, 2, 3, 0];
    const edges: [number, number][] = [
      [1, 2],
      [2, 3],
      [0, 1],
    ];
    const sorted = toposort(nodes, edges);
    expect(sorted).toEqual([0, 1, 2, 3]);
    expectOrder(sorted, edges);
  });

  it('should handle multiple paths correctly', () => {
    const nodes = ['a', 'b', 'c', 'd'];
    const edges: [string, string][] = [
      ['a', 'b'],
      ['a', 'c'],
      ['b', 'd'],
      ['c', 'd'],
    ];
    const sorted = toposort(nodes, edges);
    expect(sorted).toHaveLength(4);
    expect(new Set(sorted)).toEqual(new Set(nodes)); // Ensure all nodes are present
    expectOrder(sorted, edges);
    // Note: Multiple valid sorts exist, e.g., ['a', 'c', 'b', 'd'] or ['a', 'b', 'c', 'd']
    // expectOrder verifies the constraints.
  });

  it('should handle disconnected components', () => {
    const nodes = ['a', 'b', 'c', 'd'];
    const edges: [string, string][] = [
      ['a', 'b'],
      ['c', 'd'],
    ];
    const sorted = toposort(nodes, edges);
    expect(sorted).toHaveLength(4);
    expect(new Set(sorted)).toEqual(new Set(nodes));
    expectOrder(sorted, edges);
    // Example valid sorts: ['c', 'd', 'a', 'b'], ['a', 'b', 'c', 'd']
  });

  it('should handle nodes with no edges', () => {
    const nodes = ['a', 'b', 'c', 'd'];
    const edges: [string, string][] = [['a', 'b']];
    const sorted = toposort(nodes, edges);
    expect(sorted).toHaveLength(4);
    expect(new Set(sorted)).toEqual(new Set(nodes));
    expectOrder(sorted, edges);
    // Example valid sorts: ['c', 'd', 'a', 'b'], ['d', 'a', 'b', 'c'] etc.
    // Check that 'a' comes before 'b'.
    expect(sorted.indexOf('a')).toBeLessThan(sorted.indexOf('b'));
  });

  it('should throw ToposortCyclicalDependencyError for a simple cycle', () => {
    const nodes = ['b', 'a'];
    const edges: [string, string][] = [
      ['a', 'b'],
      ['b', 'a'],
    ];
    try {
      toposort(nodes, edges);
    } catch (e) {
      expect(e).toBeInstanceOf(ToposortCyclicalDependencyError);
      // Depending on traversal order, the reported cycle might start at 'b'
      expect((e as ToposortCyclicalDependencyError).cyclePath).satisfies(
        (path: unknown[]) =>
          (path.length === 3 &&
            path[0] === 'a' &&
            path[1] === 'b' &&
            path[2] === 'a') ||
          (path.length === 3 &&
            path[0] === 'b' &&
            path[1] === 'a' &&
            path[2] === 'b'),
      );
    }
  });

  it('should throw ToposortCyclicalDependencyError for a longer cycle', () => {
    const nodes = ['a', 'b', 'c', 'd'];
    const edges: [string, string][] = [
      ['a', 'b'],
      ['b', 'c'],
      ['c', 'd'],
      ['d', 'b'],
    ]; // Cycle: b -> c -> d -> b
    try {
      toposort(nodes, edges);
    } catch (e) {
      expect(e).toBeInstanceOf(ToposortCyclicalDependencyError);
      expect((e as ToposortCyclicalDependencyError).cyclePath).toEqual([
        'd',
        'b',
        'c',
        'd',
      ]);
    }
  });

  it('should throw ToposortCyclicalDependencyError for self-loop', () => {
    const nodes = ['a', 'b'];
    const edges: [string, string][] = [
      ['a', 'a'],
      ['a', 'b'],
    ];
    expect(() => toposort(nodes, edges)).toThrowError(
      ToposortCyclicalDependencyError,
    );
    expect(() => toposort(nodes, edges)).toThrowError(
      /Cyclical dependency detected: "a" -> "a"/,
    );
    try {
      toposort(nodes, edges);
    } catch (e) {
      expect(e).toBeInstanceOf(ToposortCyclicalDependencyError);
      expect((e as ToposortCyclicalDependencyError).cyclePath).toEqual([
        'a',
        'a',
      ]);
    }
  });

  it('should throw ToposortUnknownNodeError if edge source is not in nodes', () => {
    const nodes = ['a', 'b'];
    const edges: [string, string][] = [['c', 'a']]; // 'c' is unknown
    expect(() => toposort(nodes, edges)).toThrowError(ToposortUnknownNodeError);
    expect(() => toposort(nodes, edges)).toThrowError(
      /Unknown node referenced in edges: "c"/,
    );
    try {
      toposort(nodes, edges);
    } catch (e) {
      expect(e).toBeInstanceOf(ToposortUnknownNodeError);
      expect((e as ToposortUnknownNodeError).unknownNode).toBe('c');
    }
  });

  it('should throw ToposortUnknownNodeError if edge target is not in nodes', () => {
    const nodes = ['a', 'b'];
    const edges: [string, string][] = [['a', 'c']]; // 'c' is unknown
    expect(() => toposort(nodes, edges)).toThrowError(ToposortUnknownNodeError);
    expect(() => toposort(nodes, edges)).toThrowError(
      /Unknown node referenced in edges: "c"/,
    );
    try {
      toposort(nodes, edges);
    } catch (e) {
      expect(e).toBeInstanceOf(ToposortUnknownNodeError);
      expect((e as ToposortUnknownNodeError).unknownNode).toBe('c');
    }
  });

  it('should handle nodes as objects (reference equality)', () => {
    const nodeA = { id: 'a' };
    const nodeB = { id: 'b' };
    const nodeC = { id: 'c' };
    const nodes = [nodeA, nodeB, nodeC];
    const edges: [object, object][] = [
      [nodeA, nodeB],
      [nodeB, nodeC],
    ];
    const sorted = toposort(nodes, edges);
    // Use toStrictEqual for deep equality check with objects
    expect(sorted).toStrictEqual([nodeA, nodeB, nodeC]);
    expectOrder(sorted, edges);
  });

  it('should handle duplicate edges gracefully', () => {
    const nodes = ['a', 'b', 'c'];
    const edges: [string, string][] = [
      ['a', 'b'],
      ['b', 'c'],
      ['a', 'b'],
    ]; // Duplicate a -> b
    const sorted = toposort(nodes, edges);
    expect(sorted).toEqual(['a', 'b', 'c']);
    expectOrder(sorted, edges.slice(0, 2)); // Check order against unique edges
  });

  it('should sort nodes lexically when there is a tie', () => {
    const nodes = ['a', 'b', 'c'];
    const edges: [string, string][] = [
      ['a', 'b'],
      ['a', 'c'],
    ];
    const sorted = toposort(nodes, edges, {
      compareFunc: (a, b) => a.localeCompare(b),
    });
    expect(sorted).toEqual(['a', 'b', 'c']);
    const sortedReverse = toposort(nodes, edges, {
      compareFunc: (a, b) => b.localeCompare(a),
    });
    expect(sortedReverse).toEqual(['a', 'c', 'b']);
    expectOrder(sorted, edges);
  });

  it('should throw ToposortCyclicalDependencyError for complex graph with cycle', () => {
    const nodes = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const edges: [string, string][] = [
      // Non-cyclical dependencies
      ['a', 'b'],
      ['a', 'c'],
      ['b', 'd'],
      ['c', 'e'],
      ['d', 'f'],
      ['e', 'f'],
      // Cyclical dependencies
      ['f', 'g'],
      ['g', 'c'], // Creates cycle: c -> e -> f -> g -> c
    ];
    try {
      toposort(nodes, edges);
    } catch (e) {
      expect(e).toBeInstanceOf(ToposortCyclicalDependencyError);
      const { cyclePath } = e as ToposortCyclicalDependencyError;
      // The cycle should contain: c -> e -> f -> g -> c
      expect(cyclePath).toContain('c');
      expect(cyclePath).toContain('e');
      expect(cyclePath).toContain('f');
      expect(cyclePath).toContain('g');
      expect(cyclePath[0]).toBe(cyclePath.at(-1)); // Should start and end with same node
      expect(cyclePath.length).toBeGreaterThan(3); // Should have at least 4 nodes in the cycle
    }
  });

  it('should detect cycle in disconnected components where first unvisited node has no cycle', () => {
    // This test case reproduces the bug where cycle detection would fail
    // if the first unvisited node doesn't lead to a cycle, but other unvisited nodes do
    const nodes = ['1', 'a', 'b', 'c', 'd', 'z'];
    const edges: [string, string][] = [
      // Create a scenario where some nodes are processed by topological sort
      // but 'isolated' will be only depended on by the cycle
      ['b', '1'],
      ['b', 'z'],
      ['b', 'c'],
      ['c', 'd'],
      ['d', 'b'], // Creates cycle: b -> c -> d -> b
    ];

    try {
      toposort(nodes, edges);
      throw new Error('Expected ToposortCyclicalDependencyError');
    } catch (e) {
      expect(e).toBeInstanceOf(ToposortCyclicalDependencyError);
      const { cyclePath } = e as ToposortCyclicalDependencyError;
      // Should find the cycle despite 'b' being the first unvisited node
      expect(cyclePath.length).toBeGreaterThan(0);
      expect(cyclePath).toContain('b');
      expect(cyclePath).toContain('c');
      expect(cyclePath).toContain('d');
      expect(cyclePath[0]).toBe(cyclePath.at(-1)); // Should start and end with same node
    }
  });
});
