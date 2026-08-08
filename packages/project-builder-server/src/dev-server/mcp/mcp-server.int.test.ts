import { createConsoleLogger } from '@baseplate-dev/sync';
import { Client } from '@modelcontextprotocol/client';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import { afterEach, describe, expect, it } from 'vitest';

import type { ServiceActionContext } from '#src/actions/types.js';

import {
  ALL_SERVICE_ACTION_METADATA,
  USER_SERVICE_ACTION_METADATA,
} from '#src/actions/action-metadata-manifest.js';

import { createMcpServer } from './server.js';

/** Tools exposed by the `baseplate` CLI's MCP server, sorted by name. */
const EXPECTED_USER_TOOLS = [
  'apply-fix',
  'commit-draft',
  'configure-plugin',
  'diff-project',
  'disable-plugin',
  'discard-draft',
  'get-entity',
  'get-entity-schema',
  'get-plugin-info',
  'list-entities',
  'list-entity-types',
  'list-plugins',
  'search-entities',
  'show-draft',
  'stage-create-entity',
  'stage-delete-entity',
  'stage-patch-entity',
  'stage-update-entity',
  'sync-all-projects',
  'sync-file',
  'sync-project',
];

/** Tools exposed by the `baseplate-dev` CLI's MCP server, sorted by name. */
const EXPECTED_ALL_TOOLS = [
  ...EXPECTED_USER_TOOLS,
  'configure-raw-template',
  'configure-text-template',
  'configure-ts-template',
  'create-generator',
  'delete-template',
  'discover-generators',
  'extract-templates',
  'generate-templates',
  'init-project',
  'list-templates',
  'show-template-metadata',
  'snapshot-add',
  'snapshot-remove',
  'snapshot-save',
  'snapshot-show',
].toSorted();

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
      sessionId: 'default',
    };

    // 2. Create server
    const server = createMcpServer({
      actions: ALL_SERVICE_ACTION_METADATA,
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
    // discover-generators scans generator packages on disk, so the timeout is
    // generous to absorb variation in machine load.
  }, 120_000);

  // Guards the metadata/handler split: the manifest is hand-maintained, so a
  // missing entry or a wrong `scope` silently changes the tools clients see.
  it('should expose exactly the expected tools', async () => {
    const mockContext: ServiceActionContext = {
      projects: [],
      plugins: [],
      userConfig: {},
      logger: createConsoleLogger('warn'),
      cliVersion: '1.0.0',
      sessionId: 'default',
    };

    const server = createMcpServer({
      actions: ALL_SERVICE_ACTION_METADATA,
      context: mockContext,
    });

    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);

    client = new Client({ name: 'test-client', version: '1.0.0' });
    await client.connect(clientTransport);

    const { tools } = await client.listTools();

    expect(tools.map((tool) => tool.name).toSorted()).toEqual(
      EXPECTED_ALL_TOOLS,
    );
  });

  it('should expose only user-scoped tools to the end-user CLI', () => {
    expect(
      USER_SERVICE_ACTION_METADATA.map((action) => action.name).toSorted(),
    ).toEqual(EXPECTED_USER_TOOLS);
  });
});
