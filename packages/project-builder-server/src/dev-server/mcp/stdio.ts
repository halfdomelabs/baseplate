import type { McpServer } from '@modelcontextprotocol/server';

import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';

import type {
  AnyServiceActionMetadata,
  ServiceActionContext,
} from '#src/actions/types.js';

import { ALL_SERVICE_ACTION_METADATA } from '#src/actions/action-metadata-manifest.js';

import { createMcpServer } from './server.js';

export async function startMcpStdioServer(
  context: ServiceActionContext,
  actions: AnyServiceActionMetadata[] = ALL_SERVICE_ACTION_METADATA,
): Promise<McpServer> {
  const server = createMcpServer({
    actions,
    context,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport).catch((error: unknown) => {
    context.logger.error(error);
  });

  return server;
}
