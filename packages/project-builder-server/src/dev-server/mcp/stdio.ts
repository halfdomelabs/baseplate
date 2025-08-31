import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import type { ServiceActionContext } from '#src/actions/types.js';

import { ALL_SERVICE_ACTIONS } from '#src/actions/registry.js';

import { createMcpServer } from './server.js';

export async function startMcpStdioServer(
  context: ServiceActionContext,
): Promise<McpServer> {
  const server = createMcpServer({
    actions: ALL_SERVICE_ACTIONS,
    context,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport).catch((error: unknown) => {
    context.logger.error(error);
  });

  return server;
}
