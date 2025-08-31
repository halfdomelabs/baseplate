import type { FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import type { FastifyBaseLogger, FastifyInstance } from 'fastify';

import { enhanceErrorWithContext } from '@baseplate-dev/utils';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { fastify } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';

import type { ServiceActionContext } from '#src/actions/types.js';

import { ALL_SERVICE_ACTIONS } from '#src/actions/registry.js';

import type { DevServerRouter } from './api/router.js';
import type { DevServerConfig } from './get-or-create-config.js';

import { devServerRouter } from './api/router.js';
import { devServerAuthPlugin } from './auth-plugin.js';
import { getOrCreateDevServerConfig } from './get-or-create-config.js';
import { mcpPlugin } from './mcp/fastify.js';
import { createMcpServer } from './mcp/server.js';

export interface DevServerOptions {
  cwd: string;
  context: ServiceActionContext;
}

async function createServer(
  config: DevServerConfig,
  context: ServiceActionContext,
): Promise<FastifyInstance> {
  // Create Fastify server
  const server = fastify({
    loggerInstance: context.logger as FastifyBaseLogger,
    forceCloseConnections: 'idle',
    maxParamLength: 10_000,
  });

  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  // Add authentication hook for all dev routes
  await server.register(devServerAuthPlugin, config);

  // Register TRPC router
  await server.register(fastifyTRPCPlugin, {
    prefix: '/dev/trpc',
    trpcOptions: {
      router: devServerRouter,
      createContext: () => context,
      onError: ({ error }) => {
        server.log.error(error);
      },
    },
  } satisfies FastifyTRPCPluginOptions<DevServerRouter>);

  // Register MCP server
  const mcpServer = createMcpServer({
    actions: ALL_SERVICE_ACTIONS,
    context,
    forwardAllLogsToConsole: true,
  });
  await server.register(mcpPlugin, {
    mcpServer,
  });

  return server;
}

export class DevServer {
  private server: FastifyInstance | null = null;
  private context: ServiceActionContext;
  private cwd: string;

  constructor(options: DevServerOptions) {
    this.context = options.context;
    this.cwd = options.cwd;
  }

  async start(): Promise<{ port: number; token: string }> {
    if (this.server) {
      throw new Error('Server is already running');
    }

    // Get or create server configuration
    const configResult = await getOrCreateDevServerConfig(this.cwd);

    const server = await createServer(configResult, this.context);
    this.server = server;

    // Start server
    try {
      await server.listen({
        port: configResult.port,
        host: '127.0.0.1',
      });

      server.log.info(
        `Baseplate dev server started for projects: ${this.context.projects.map((p) => p.name).join(', ')}`,
        {
          port: configResult.port,
          token: configResult.token,
          projects: this.context.projects.map((p) => p.name),
        },
      );

      return {
        port: configResult.port,
        token: configResult.token,
      };
    } catch (error) {
      this.server = null;
      throw enhanceErrorWithContext(error, 'Failed to start dev server');
    }
  }

  async stop(): Promise<void> {
    if (this.server) {
      await this.server.close();
      this.server = null;
    }
  }

  isRunning(): boolean {
    return this.server !== null;
  }
}
