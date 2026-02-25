import type { Command } from 'commander';

import { ALL_SERVICE_ACTIONS } from '@baseplate-dev/project-builder-server/actions';

import { createServiceActionContext } from '#src/utils/create-service-action-context.js';

export function addMcpCommand(program: Command): void {
  program
    .command('mcp')
    .description('Start the MCP server in stdio mode (full dev action set)')
    .action(async () => {
      const context = await createServiceActionContext();

      const { startMcpStdioServer } =
        await import('@baseplate-dev/project-builder-server/dev-server');

      await startMcpStdioServer(context, ALL_SERVICE_ACTIONS);
    });
}
