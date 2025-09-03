import type { Command } from 'commander';

import { createServiceActionContext } from '#src/utils/create-service-action-context.js';

export function addMcpCommand(program: Command): void {
  program
    .command('mcp')
    .description('Start the MCP server in stdio mode')
    .action(async () => {
      const context = await createServiceActionContext();

      const { startMcpStdioServer } = await import(
        '@baseplate-dev/project-builder-server/dev-server'
      );

      await startMcpStdioServer(context);
    });
}
