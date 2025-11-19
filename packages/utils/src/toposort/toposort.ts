import TinyQueue from 'tinyqueue';

import { compareStrings } from '../string/compare-strings.js';
import {
  ToposortCyclicalDependencyError,
  ToposortUnknownNodeError,
} from './errors.js';

/**
 * Creates a map of outgoing edges from node indices to their target indices
 */
function makeOutgoingEdges<T>(
  nodes: Map<T, number>,
  edgeArr: [T, T][],
): Map<number, Set<number>> {
  const outgoingEdgesMap = new Map<number, Set<number>>();
  for (const edge of edgeArr) {
    const [source, target] = edge;
    const sourceIndex = nodes.get(source);
    const targetIndex = nodes.get(target);
    // Check both source and target exist in the provided nodes set
    if (sourceIndex === undefined) throw new ToposortUnknownNodeError(source);
    if (targetIndex === undefined) throw new ToposortUnknownNodeError(target);

    const sourceEdges = outgoingEdgesMap.get(sourceIndex);
    if (sourceEdges) {
      sourceEdges.add(targetIndex);
    } else {
      outgoingEdgesMap.set(sourceIndex, new Set([targetIndex]));
    }
  }
  return outgoingEdgesMap;
}

/**
 * Creates a map of node indices to their in-degree
 */
function makeNodeInDegrees(
  outgoingEdgesMap: Map<number, Set<number>>,
  nodeLength: number,
): number[] {
  const nodeInDegrees = Array.from({ length: nodeLength }, () => 0);
  for (const [, targets] of outgoingEdgesMap.entries()) {
    for (const target of targets) {
      nodeInDegrees[target]++;
    }
  }
  return nodeInDegrees;
}

/**
 * Detects cycles in a graph by checking if all nodes are included in the topological sort
 */
function detectCycle<T>(
  nodes: T[],
  visited: Set<number>,
  edges: Map<number, Set<number>>,
): T[] {
  // If all nodes were visited, no cycle exists
  if (visited.size === nodes.length) {
    return [];
  }

  // Run DFS from any unvisited node to find a cycle
  const path: number[] = [];
  const visitSet = new Set<number>();

  function dfs(node: number): boolean {
    if (visitSet.has(node)) {
      path.push(node);
      return true;
    }

    if (visited.has(node)) {
      return false;
    }

    visitSet.add(node);
    path.push(node);

    const neighbors = edges.get(node) ?? new Set<number>();
    for (const neighbor of neighbors) {
      if (dfs(neighbor)) {
        return true;
      }
    }

    path.pop();
    visitSet.delete(node);
    return false;
  }

  // For cycle detection, we need to try all unvisited nodes
  for (let i = 0; i < nodes.length; i++) {
    if (!visited.has(i)) {
      // Reset path and visitSet for each starting node
      path.length = 0;
      visitSet.clear();

      const cycleFound = dfs(i);

      if (cycleFound) {
        // Convert path indices to actual nodes
        return path.map((idx) => nodes[idx]);
      }
    }
  }

  return [];
}

/**
 * Default comparison function for stable topological sort
 */
function defaultCompareFunc<T>(a: T, b: T): number {
  if (typeof a === 'string' && typeof b === 'string') {
    return compareStrings(a, b);
  }
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

interface ToposortOptions<T> {
  /**
   * Optional custom comparison function to break ties between nodes with the same topological level
   *
   * This allows for a stable topological sort that is consistent with the input order of nodes with the same topological level.
   */
  compareFunc?: (a: T, b: T) => number;
}

/**
 * Performs a topological sort on a directed acyclic graph.
 *
 * @param nodes - The nodes to sort
 * @param edges - The edges of the graph
 * @param options - Optional options for the topological sort
 * @returns The sorted nodes
 */
export function toposort<T>(
  nodes: T[],
  edges: [T, T][],
  options: ToposortOptions<T> = {},
): T[] {
  const { compareFunc } = options;

  // Map each node to its index
  const nodeIndexMap = new Map<T, number>(
    nodes.map((node, index) => [node, index]),
  );

  // Create a map of outgoing edges from each node
  const outgoingEdgesMap = makeOutgoingEdges(nodeIndexMap, edges);
  const nodeInDegrees = makeNodeInDegrees(outgoingEdgesMap, nodes.length);

  // Create a queue of nodes with no incoming edges (in-degree == 0)
  const zeroInDegreeQueue = compareFunc
    ? new TinyQueue<number>([], (a, b) => compareFunc(nodes[a], nodes[b]))
    : ([] as number[]);

  for (const [i, nodeInDegree] of nodeInDegrees.entries()) {
    if (nodeInDegree === 0) {
      zeroInDegreeQueue.push(i);
    }
  }

  const result: T[] = [];
  const visited = new Set<number>();

  // Process nodes in BFS order
  while (zeroInDegreeQueue.length > 0) {
    const current = zeroInDegreeQueue.pop();
    if (current === undefined) break;
    visited.add(current);
    result.push(nodes[current]);

    // Process all outgoing edges from the current node
    const outgoingEdges = outgoingEdgesMap.get(current);
    if (outgoingEdges) {
      for (const target of outgoingEdges) {
        nodeInDegrees[target]--;

        // If the target node now has no incoming edges, add it to the queue
        if (nodeInDegrees[target] === 0) {
          zeroInDegreeQueue.push(target);
        }
      }
    }
  }

  // Check for cycles
  if (result.length !== nodes.length) {
    const cyclePath = detectCycle(nodes, visited, outgoingEdgesMap);
    throw new ToposortCyclicalDependencyError(cyclePath);
  }

  return result;
}

/**
 * Performs a topological sort on a directed acyclic graph, always selecting
 * the smallest available node according to the provided comparison function,
 * yielding the lexicographically minimal ordering.
 *
 * @param nodes - The nodes to sort
 * @param edges - The edges of the graph
 * @param compareFunc - Optional custom comparison function to break ties between nodes with the same topological level (default is string comparison)
 * @returns The sorted nodes
 */
export function toposortOrdered<T>(
  nodes: T[],
  edges: [T, T][],
  compareFunc: (a: T, b: T) => number = defaultCompareFunc,
): T[] {
  return toposort(nodes, edges, { compareFunc });
}
