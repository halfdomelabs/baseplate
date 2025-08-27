import { createEventedLogger } from '@baseplate-dev/sync';
import { enhanceErrorWithContext } from '@baseplate-dev/utils';
import {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js';
import { SetLevelRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import type {
  AnyServiceAction,
  ServiceAction,
  ServiceActionContext,
} from '#src/actions/types.js';

// List of MCP log levels ordered from most to least verbose
const LOG_LEVEL_LIST = [
  'debug',
  'info',
  'notice',
  'warning',
  'error',
  'critical',
  'alert',
  'emergency',
] as const;

type LogLevel = (typeof LOG_LEVEL_LIST)[number];

export function createMcpServer(
  actions: AnyServiceAction[],
  context: ServiceActionContext,
): McpServer {
  const { projects, logger } = context;

  const server = new McpServer(
    {
      name: 'baseplate-dev-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        logging: {},
      },
    },
  );

  server.registerResource(
    'projects',
    new ResourceTemplate('baseplate://projects/{projectId}', {
      list: () => ({
        resources: projects.map((p) => ({
          uri: `baseplate://projects/${p.id}`,
          name: p.name,
        })),
      }),
    }),
    {
      title: 'Projects',
      description: 'A list of projects tracked by the dev server',
    },
    (uri, { projectId }) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) {
        return { contents: [] };
      }
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(project),
            mimeType: 'application/json',
          },
        ],
      };
    },
  );

  let logLevel: LogLevel = 'info';

  server.server.setRequestHandler(SetLevelRequestSchema, (request) => {
    logLevel = request.params.level;
    return {};
  });

  const mcpLogger = createEventedLogger({
    noConsole: true,
  });

  mcpLogger.onMessage((message) => {
    const mcpLevel = message.level === 'warn' ? 'warning' : message.level;
    if (LOG_LEVEL_LIST.indexOf(logLevel) < LOG_LEVEL_LIST.indexOf(mcpLevel)) {
      return;
    }

    server.server
      .sendLoggingMessage({
        // match MCP specification for warn => warning
        level: mcpLevel,
        data: {
          message: message.message,
        },
      })
      .catch((err: unknown) => {
        logger.error(
          enhanceErrorWithContext(err, 'Failed to send logging message'),
        );
      });
  });

  const mcpServiceContext: ServiceActionContext = {
    ...context,
    logger: mcpLogger,
  };

  for (const action of actions) {
    const typedAction = action as ServiceAction;
    server.registerTool(
      action.name,
      {
        title: action.title,
        description: action.description,
        inputSchema: typedAction.inputSchema,
        outputSchema: typedAction.outputSchema,
      },
      async (input) => {
        const result = await typedAction.handler(input, mcpServiceContext);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
              mimeType: 'application/json',
            },
          ],
          structuredContent: result,
        };
      },
    );
  }

  return server;
}
