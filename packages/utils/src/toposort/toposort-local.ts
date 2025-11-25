import { compareStrings } from '../string/compare-strings.js';
import {
  ToposortCyclicalDependencyError,
  ToposortUnknownNodeError,
} from './errors.js';

/**
 * Creates a map of inbound edges from node indices to their source indices
 */
function makeInboundEdges<T>(
  nodes: Map<T, number>,
  edgeArr: [T, T][],
): Map<number, Set<number>> {
  const inboundEdgesMap = new Map<number, Set<number>>();
  for (const edge of edgeArr) {
    const [source, target] = edge;
    const sourceIndex = nodes.get(source);
    const targetIndex = nodes.get(target);
    // Check both source and target exist in the provided nodes set
    if (sourceIndex === undefined) throw new ToposortUnknownNodeError(source);
    if (targetIndex === undefined) throw new ToposortUnknownNodeError(target);

    const targetEdges = inboundEdgesMap.get(targetIndex);
    if (targetEdges) {
      targetEdges.add(sourceIndex);
    } else {
      inboundEdgesMap.set(targetIndex, new Set([sourceIndex]));
    }
  }
  return inboundEdgesMap;
}

/**
 * Creates a map of node indices to their out-degree
 */
function makeNodeOutDegrees(
  inboundEdgesMap: Map<number, Set<number>>,
  nodeLength: number,
): number[] {
  const nodeOutDegrees = Array.from({ length: nodeLength }, () => 0);
  for (const [, sources] of inboundEdgesMap.entries()) {
    for (const source of sources) {
      nodeOutDegrees[source]++;
    }
  }
  return nodeOutDegrees;
}

/**
 * Detects a cycle in a graph and returns the path of the first cycle found.
 */
function detectCycle<T>(
  nodes: T[],
  // Set of nodes already processed by a prior algorithm (e.g., a topological sort).
  // This function will only search for cycles among the remaining nodes.
  initialVisited: Set<number>,
  edges: Map<number, Set<number>>,
): T[] {
  // Tracks nodes visited by ANY DFS traversal within this function.
  const cycleCheckVisited = new Set<number>();

  for (let i = 0; i < nodes.length; i++) {
    if (!initialVisited.has(i) && !cycleCheckVisited.has(i)) {
      const path: number[] = [];
      const recursionStack = new Set<number>();

      const cyclePath = dfs(i, path, recursionStack);

      if (cyclePath) {
        // A cycle was found, convert indices to nodes and return immediately.
        return cyclePath.map((idx) => nodes[idx]);
      }
    }
  }

  // No cycles were found in any of the graph's components.
  return [];

  /**
   * Performs a DFS from a starting node to find a cycle.
   * @returns The cycle path as an array of indices if found, otherwise null.
   */
  function dfs(
    node: number,
    path: number[],
    recursionStack: Set<number>,
  ): number[] | null {
    path.push(node);
    recursionStack.add(node);
    cycleCheckVisited.add(node);

    const neighbors = edges.get(node) ?? new Set<number>();
    for (const neighbor of neighbors) {
      if (recursionStack.has(neighbor)) {
        const cycleStartIndex = path.indexOf(neighbor);
        const cycle = path.slice(cycleStartIndex);
        cycle.push(neighbor);
        return cycle;
      }

      // If the neighbor hasn't been visited by any DFS run yet, recurse.
      if (!cycleCheckVisited.has(neighbor)) {
        const result = dfs(neighbor, path, recursionStack);
        if (result) {
          // A cycle was found deeper in the traversal; propagate the result up.
          return result;
        }
      }
    }

    // Backtrack: No cycle found from this node.
    recursionStack.delete(node);
    path.pop();
    return null;
  }
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
 * Performs a locality-based topological sort on a directed acyclic graph.
 *
 * This is a variant of Kahn's algorithm that starts from nodes with no outbound edges first,
 * and then works its way back.
 *
 * This is useful for tasks where we want to process nodes in a way that is consistent with their locality in the graph
 * such as sorting fragments of a generated code file that depend on each other.
 *
 * @param nodes - The nodes to sort
 * @param edges - The edges of the graph
 * @param options - Optional options for the topological sort
 * @returns The sorted nodes
 */
export function toposortLocal<T>(
  nodes: T[],
  edges: [T, T][],
  options: ToposortOptions<T> = {},
): T[] {
  const { compareFunc = defaultCompareFunc } = options;
  const compareIdx = (a: number, b: number): number =>
    compareFunc(nodes[a], nodes[b]);

  // Map each node to its index
  const nodeIndexMap = new Map<T, number>(
    nodes.map((node, index) => [node, index]),
  );

  // Create a map of outgoing edges from each node
  const inboundEdgesMap = makeInboundEdges(nodeIndexMap, edges);
  const nodeOutDegrees = makeNodeOutDegrees(inboundEdgesMap, nodes.length);

  // Create a stack of nodes with no incoming edges (in-degree == 0)
  // We use a stack so that the most recently added nodes are processed first
  const zeroOutDegreeStack: number[] = [];

  for (const [i, nodeOutDegree] of nodeOutDegrees.entries()) {
    if (nodeOutDegree === 0) {
      zeroOutDegreeStack.push(i);
    }
  }
  zeroOutDegreeStack.sort(compareIdx);

  const reverseResult: T[] = [];
  const visited = new Set<number>();

  // Process nodes in BFS order
  while (zeroOutDegreeStack.length > 0) {
    const current = zeroOutDegreeStack.pop();
    if (current === undefined) break;
    visited.add(current);
    reverseResult.push(nodes[current]);

    // Process all outgoing edges from the current node
    const incomingEdges = inboundEdgesMap.get(current);
    const newZeroOutDegreeNodes: number[] = [];
    if (incomingEdges) {
      for (const source of incomingEdges) {
        nodeOutDegrees[source]--;

        // If the target node now has no incoming edges, add it to the queue
        if (nodeOutDegrees[source] === 0) {
          newZeroOutDegreeNodes.push(source);
        }
      }
    }
    newZeroOutDegreeNodes.sort(compareIdx);
    zeroOutDegreeStack.push(...newZeroOutDegreeNodes);
  }

  // Check for cycles
  if (reverseResult.length !== nodes.length) {
    const cyclePath = detectCycle(nodes, visited, inboundEdgesMap);
    throw new ToposortCyclicalDependencyError(cyclePath.toReversed());
  }

  return reverseResult.toReversed();
}
