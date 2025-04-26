export class ToposortCyclicalDependencyError extends Error {
  public cyclePath: unknown[];
  constructor(nodes: unknown[]) {
    super(
      `Cyclical dependency detected: ${nodes.map((n) => JSON.stringify(n)).join(' -> ')}`,
    );
    this.name = 'ToposortCyclicalDependencyError';
    this.cyclePath = nodes; // Store the path for potential inspection
  }
}

export class ToposortUnknownNodeError extends Error {
  public unknownNode: unknown;
  constructor(node: unknown) {
    super(`Unknown node referenced in edges: ${JSON.stringify(node)}`);
    this.name = 'ToposortUnknownNodeError';
    this.unknownNode = node; // Store the node for potential inspection
  }
}
