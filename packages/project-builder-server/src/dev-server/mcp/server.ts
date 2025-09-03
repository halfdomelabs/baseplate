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

import { runActionInWorker } from '#src/actions/utils/run-in-worker.js';

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

interface CreateMcpServerOptions {
  context: ServiceActionContext;
  actions: AnyServiceAction[];
  /**
   * Whether to forward all logs to the console. (errors are always forwarded)
   *
   * This is important to leave disable in the context of STDIO mode since we can't have the console logs clobbering the output.
   */
  forwardAllLogsToConsole?: boolean;
}

export function createMcpServer({
  actions,
  context,
  forwardAllLogsToConsole,
}: CreateMcpServerOptions): McpServer {
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
            text: JSON.stringify({
              id: project.id,
              directory: project.directory,
              name: project.name,
            }),
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

  const mcpLogger = createEventedLogger();

  mcpLogger.onMessage((message) => {
    const mcpLevel = message.level === 'warn' ? 'warning' : message.level;
    if (LOG_LEVEL_LIST.indexOf(logLevel) > LOG_LEVEL_LIST.indexOf(mcpLevel)) {
      return;
    }

    if (message.level === 'error' || forwardAllLogsToConsole) {
      logger[message.level](message.metadata ?? {}, message.message);
    }

    server.server
      .sendLoggingMessage({
        // match MCP specification for warn => warning
        level: mcpLevel,
        data: {
          message: message.message,
          metadata: message.metadata,
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

  let isActionRunning = false;

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
        if (isActionRunning) {
          throw new Error('An action is already running');
        }

        try {
          isActionRunning = true;
          const result = await runActionInWorker(
            typedAction,
            input,
            mcpServiceContext,
          );
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
        } finally {
          isActionRunning = false;
        }
      },
    );
  }

  return server;
}
