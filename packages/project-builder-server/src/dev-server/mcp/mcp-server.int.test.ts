import { createConsoleLogger } from '@baseplate-dev/sync';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, describe, expect, it } from 'vitest';

import type { ServiceActionContext } from '#src/actions/types.js';

import { ALL_SERVICE_ACTIONS } from '#src/actions/registry.js';

import { createMcpServer } from './server.js';

describe('MCP Server', () => {
  let client: Client | undefined;
  let clientTransport: InMemoryTransport | undefined;
  let serverTransport: InMemoryTransport | undefined;

  afterEach(async () => {
    await client?.close();
    await clientTransport?.close();
    await serverTransport?.close();
  });

  it('should handle discover-generators tool call', async () => {
    // 1. Create mock context with no-op logger
    const mockContext: ServiceActionContext = {
      projects: [],
      plugins: [],
      userConfig: {},
      logger: createConsoleLogger('warn'),
      cliVersion: '1.0.0',
    };

    // 2. Create server
    const server = createMcpServer({
      actions: ALL_SERVICE_ACTIONS,
      context: mockContext,
      forwardAllLogsToConsole: true,
    });

    // 3. Create linked transports
    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    // 4. Connect server to its transport
    await server.connect(serverTransport);

    // 5. Create and connect client
    client = new Client({ name: 'test-client', version: '1.0.0' });
    await client.connect(clientTransport);

    // 6. Call the discover-generators tool
    const result = await client.callTool({
      name: 'discover-generators',
      arguments: {},
    });

    // 7. Verify response structure
    // Log the result for debugging
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    expect(result.structuredContent).toBeDefined();
    expect(result.structuredContent).toHaveProperty('generators');
    expect(
      Array.isArray(
        (result.structuredContent as Record<string, unknown>).generators,
      ),
    ).toBe(true);
  }, 20_000); // 10 second timeout
});
