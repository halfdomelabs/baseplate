import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import fastifyPlugin from 'fastify-plugin';
import { randomUUID } from 'node:crypto';

interface McpPluginOptions {
  mcpServer: McpServer;
}

const mcpPluginCallback: FastifyPluginCallbackZod<McpPluginOptions> = function (
  fastify: FastifyInstance,
  { mcpServer },
  done,
) {
  // Map to store transports by session ID
  const transports: Record<string, StreamableHTTPServerTransport | undefined> =
    {};

  // Handle POST requests for client-to-server communication
  fastify.post('/dev/mcp', async (req: FastifyRequest, reply: FastifyReply) => {
    // Check for existing session ID
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          // Store the transport by session ID
          transports[newSessionId] = transport;
          fastify.log.info('MCP session initialized', {
            sessionId: newSessionId,
          });
        },
        // DNS rebinding protection
        enableDnsRebindingProtection: true,
      });

      // Clean up transport when closed
      // eslint-disable-next-line unicorn/prefer-add-event-listener -- MCP server requires this signature
      transport.onclose = () => {
        if (transport.sessionId) {
          transports[transport.sessionId] = undefined;
          fastify.log.info('MCP session closed', {
            sessionId: transport.sessionId,
          });
        }
      };

      await mcpServer.connect(transport);
    } else {
      // Invalid request
      reply.status(400);
      return {
        jsonrpc: '2.0',
        error: {
          code: -32_000,
          message:
            'Bad Request: No valid session ID provided or not an initialize request',
        },
        id: null,
      };
    }

    // Handle the request
    await transport.handleRequest(req.raw, reply.raw, req.body);
  });

  // Reusable handler for GET and DELETE requests
  const handleSessionRequest = async (
    req: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      reply.status(400).send({
        error: 'Invalid or missing session ID',
      });
      return;
    }

    const transport = transports[sessionId];
    await transport.handleRequest(req.raw, reply.raw, req.body);
  };

  // Handle GET requests for server-to-client notifications via SSE
  fastify.get('/dev/mcp', handleSessionRequest);

  // Handle DELETE requests for session termination
  fastify.delete('/dev/mcp', handleSessionRequest);

  fastify.log.info('MCP plugin registered', {
    endpoint: '/dev/mcp',
  });

  done();
};

export const mcpPlugin = fastifyPlugin(mcpPluginCallback);
