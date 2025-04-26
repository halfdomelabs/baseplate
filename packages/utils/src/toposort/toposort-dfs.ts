import {
  ToposortCyclicalDependencyError,
  ToposortUnknownNodeError,
} from './errors.js';

function makeOutgoingEdges<T>(
  nodes: Map<T, number>,
  edgeArr: [T, T][],
): Map<number, Set<number>> {
  const edges = new Map<number, Set<number>>();
  for (const edge of edgeArr) {
    const [source, target] = edge;
    const sourceIndex = nodes.get(source);
    const targetIndex = nodes.get(target);
    // Check both source and target exist in the provided nodes set
    if (sourceIndex === undefined) throw new ToposortUnknownNodeError(source);
    if (targetIndex === undefined) throw new ToposortUnknownNodeError(target);

    const sourceEdges = edges.get(sourceIndex);
    if (sourceEdges) {
      sourceEdges.add(targetIndex);
    } else {
      edges.set(sourceIndex, new Set([targetIndex]));
    }
  }
  return edges;
}

/**
 * Topological sort of nodes using the depth-first search algorithm
 *
 * This algorithm is deprecated for now since it is less performant than BFS.
 * However, it is still being used in sorting run steps so kept around for the moment.
 *
 * @param nodes - The nodes to sort
 * @param edges - The edges of the graph
 *
 * @returns The sorted nodes
 */
export function toposortDfs<T>(nodes: T[], edges: [T, T][]): T[] {
  const nodeIndexMap = new Map<T, number>(
    nodes.map((node, index) => [node, index]),
  );

  let cursor = nodes.length;
  const sorted = Array.from<T>({ length: cursor });
  const outgoingEdgesMap = makeOutgoingEdges(nodeIndexMap, edges);

  const visited = new Set<number>(); // Nodes whose subgraph is fully explored (Black set)
  const visiting = new Set<number>(); // Nodes currently on the recursion stack (Gray set)

  function visit(idx: number, path: number[]): void {
    if (visited.has(idx)) {
      return; // Already fully processed, do nothing
    }
    if (visiting.has(idx)) {
      // Cycle detected! Reconstruct the cycle path from the current path
      const cycleStartIndex = path.indexOf(idx);
      const cyclePath = [...path.slice(cycleStartIndex), idx].map(
        (i) => nodes[i],
      );
      throw new ToposortCyclicalDependencyError(cyclePath);
    }

    visiting.add(idx);
    path.push(idx); // Add node to current path (for error reporting)

    const outgoingEdges = outgoingEdgesMap.get(idx);
    if (outgoingEdges) {
      // TODO: Reversing the array is necessary to keep the behavior consistent
      // with toposort.array from the toposort package. Once we make the
      // generation order independent, we can remove this logic and the reverse
      // iteration below.
      const outgoingEdgesArray = [...outgoingEdges];
      for (const neighbor of outgoingEdgesArray.reverse()) {
        visit(neighbor, path);
      }
    }

    path.pop(); // Remove node from current path as we backtrack
    visiting.delete(idx); // Move from visiting (Gray) set...
    visited.add(idx); // ...to visited (Black) set
    sorted[--cursor] = nodes[idx]; // Add to the head of the sorted list
  }

  // Iterate through the original nodes array to maintain initial order preference
  // for disconnected components or nodes with same topological level.
  for (let i = nodes.length - 1; i >= 0; i--) {
    visit(i, []);
  }

  return sorted;
}
