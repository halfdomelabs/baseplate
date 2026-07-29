/**
 * Reads a node index that is in-bounds by construction, throwing if the graph
 * bookkeeping is corrupt rather than silently producing a wrong ordering.
 */
export function atNodeIndex<T>(items: T[], index: number): T {
  const item = items[index];
  if (item === undefined) {
    throw new Error(`Toposort encountered an unknown node index: ${index}`);
  }
  return item;
}
