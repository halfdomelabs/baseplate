import { describe, expect, it } from 'vitest';

import {
  ToposortCyclicalDependencyError,
  ToposortUnknownNodeError,
} from './errors.js';
import { toposortLocal } from './toposort-local.js';

describe('toposortLocal', () => {
  it('should return an empty array for an empty graph', () => {
    expect(toposortLocal([], [])).toEqual([]);
  });

  it('should return the single node for a graph with one node', () => {
    expect(toposortLocal(['a'], [])).toEqual(['a']);
    expect(toposortLocal([1], [])).toEqual([1]);
  });

  it('should sort nodes in a simple linear chain', () => {
    const nodes = ['a', 'b', 'c'];
    const edges: [string, string][] = [
      ['a', 'b'],
      ['b', 'c'],
    ];
    const sorted = toposortLocal(nodes, edges);
    expect(sorted).toEqual(['a', 'b', 'c']);
  });

  it('should sort nodes in a simple linear chain (numbers)', () => {
    const nodes = [1, 2, 3, 0];
    const edges: [number, number][] = [
      [1, 2],
      [2, 3],
      [0, 1],
    ];
    const sorted = toposortLocal(nodes, edges);
    expect(sorted).toEqual([0, 1, 2, 3]);
  });

  it('should handle multiple paths correctly', () => {
    const nodes = ['a', 'b', 'c', 'd'];
    const edges: [string, string][] = [
      ['a', 'b'],
      ['a', 'c'],
      ['b', 'd'],
      ['c', 'd'],
    ];
    const sorted = toposortLocal(nodes, edges);
    expect(sorted).toEqual(['a', 'b', 'c', 'd']);
    // check reverse order
    const reverseSorted = toposortLocal(nodes.toReversed(), edges);
    expect(reverseSorted).toEqual(['a', 'b', 'c', 'd']);
  });

  it('should handle disconnected components alphabetically', () => {
    const nodes = ['a', 'b', 'c', 'd'];
    const edges: [string, string][] = [
      ['a', 'b'],
      ['c', 'd'],
    ];
    const sorted = toposortLocal(nodes, edges);
    expect(sorted).toEqual(['a', 'b', 'c', 'd']);
    // check reverse order
    const reverseSorted = toposortLocal(nodes.toReversed(), edges);
    expect(reverseSorted).toEqual(['a', 'b', 'c', 'd']);
  });

  it('should handle nodes without edges alphabetically', () => {
    const nodes = ['a', 'b', 'c', 'd'];
    const edges: [string, string][] = [];
    const sorted = toposortLocal(nodes, edges);
    expect(sorted).toEqual(['a', 'b', 'c', 'd']);
    // check reverse order
    const reverseSorted = toposortLocal(nodes.toReversed(), edges);
    expect(reverseSorted).toEqual(['a', 'b', 'c', 'd']);
  });

  it('should handle a local sort with custom compare function', () => {
    /**
     * Mermaid graph:
    graph LR
      %% Nodes
      sec-a["sec-a"]
      sec-b["sec-b"]
      sec-c["sec-c"]
      sec-d["sec-d"]
      pri-a["pri-a"]
      pri-b["pri-b"]
      pri-c["pri-c"]
      
      %% Edges
      sec-a --> sec-c
      sec-b --> pri-a
      sec-c --> pri-a
      sec-c --> pri-c
      sec-d --> pri-c
      pri-a --> pri-b
      pri-b --> pri-c

      %% Styling
      classDef secondary fill:#a8d1ff,stroke:#0066cc,stroke-width:1px;
      classDef primary fill:#ffcccc,stroke:#cc0000,stroke-width:1px;
      
      class sec-a,sec-b,sec-c,sec-d secondary;
      class pri-a,pri-b,pri-c primary;
     */
    const nodes = [
      'sec-a',
      'sec-b',
      'sec-c',
      'sec-d',
      'pri-a',
      'pri-b',
      'pri-c',
    ];
    const edges: [string, string][] = [
      ['sec-a', 'sec-c'],
      ['sec-b', 'pri-a'],
      ['sec-c', 'pri-a'],
      ['sec-c', 'pri-c'],
      ['sec-d', 'pri-c'],
      ['pri-a', 'pri-b'],
      ['pri-b', 'pri-c'],
    ];
    const getPrefixValue = (node: string): number => {
      const prefix = node.split('-')[0];
      // we want to sort primary nodes before secondary nodes so that
      // secondary nodes are bubbled to the top
      return prefix === 'pri' ? 0 : 1;
    };
    const compareFunc = (a: string, b: string): number => {
      const prefixA = getPrefixValue(a);
      const prefixB = getPrefixValue(b);
      const compareResult = prefixA - prefixB;
      if (compareResult !== 0) return compareResult;
      return a.localeCompare(b);
    };
    const expected = [
      'sec-b',
      'sec-a',
      'sec-c',
      'pri-a',
      'pri-b',
      'sec-d',
      'pri-c',
    ];
    // Check that the sorted result is consistent with the expected order
    expect(
      toposortLocal(nodes, edges, {
        compareFunc,
      }),
    ).toEqual(expected);
    // Check that the sorted result is stable when we reverse the nodes
    expect(
      toposortLocal(nodes.toReversed(), edges, {
        compareFunc,
      }),
    ).toEqual(expected);
  });

  it('should throw ToposortCyclicalDependencyError for a simple cycle', () => {
    const nodes = ['a', 'b'];
    const edges: [string, string][] = [
      ['a', 'b'],
      ['b', 'a'],
    ];
    try {
      toposortLocal(nodes, edges);
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
    ]; // Cycle: d -> b -> c -> d
    try {
      toposortLocal(nodes, edges);
    } catch (e) {
      expect(e).toBeInstanceOf(ToposortCyclicalDependencyError);
      expect((e as ToposortCyclicalDependencyError).cyclePath).toEqual([
        'b',
        'c',
        'd',
        'b',
      ]);
    }
  });

  it('should throw ToposortCyclicalDependencyError for self-loop', () => {
    const nodes = ['a', 'b'];
    const edges: [string, string][] = [
      ['a', 'a'],
      ['a', 'b'],
    ];
    expect(() => toposortLocal(nodes, edges)).toThrowError(
      ToposortCyclicalDependencyError,
    );
    expect(() => toposortLocal(nodes, edges)).toThrowError(
      /Cyclical dependency detected: "a" -> "a"/,
    );
    try {
      toposortLocal(nodes, edges);
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
    expect(() => toposortLocal(nodes, edges)).toThrowError(
      ToposortUnknownNodeError,
    );
    expect(() => toposortLocal(nodes, edges)).toThrowError(
      /Unknown node referenced in edges: "c"/,
    );
    try {
      toposortLocal(nodes, edges);
    } catch (e) {
      expect(e).toBeInstanceOf(ToposortUnknownNodeError);
      expect((e as ToposortUnknownNodeError).unknownNode).toBe('c');
    }
  });

  it('should throw ToposortUnknownNodeError if edge target is not in nodes', () => {
    const nodes = ['a', 'b'];
    const edges: [string, string][] = [['a', 'c']]; // 'c' is unknown
    expect(() => toposortLocal(nodes, edges)).toThrowError(
      ToposortUnknownNodeError,
    );
    expect(() => toposortLocal(nodes, edges)).toThrowError(
      /Unknown node referenced in edges: "c"/,
    );
    try {
      toposortLocal(nodes, edges);
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
    const edges: [{ id: string }, { id: string }][] = [
      [nodeA, nodeB],
      [nodeB, nodeC],
    ];
    const sorted = toposortLocal(nodes, edges);
    // Use toStrictEqual for deep equality check with objects
    expect(sorted).toStrictEqual([nodeA, nodeB, nodeC]);
  });

  it('should handle duplicate edges gracefully', () => {
    const nodes = ['a', 'b', 'c'];
    const edges: [string, string][] = [
      ['a', 'b'],
      ['b', 'c'],
      ['a', 'b'],
    ]; // Duplicate a -> b
    const sorted = toposortLocal(nodes, edges);
    expect(sorted).toEqual(['a', 'b', 'c']);
  });
});
