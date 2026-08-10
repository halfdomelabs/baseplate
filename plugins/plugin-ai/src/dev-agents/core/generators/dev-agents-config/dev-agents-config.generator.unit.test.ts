import { describe, expect, it } from 'vitest';

import {
  buildAgentDocsList,
  buildMcpSetupInstructions,
} from './dev-agents-config.generator.js';

describe('buildMcpSetupInstructions', () => {
  it('includes the Codex MCP configuration when Codex is enabled', () => {
    expect(buildMcpSetupInstructions(['codex'])).toBe(
      [
        '**Codex:** Add to `.codex/config.toml`:',
        '```toml',
        '[mcp_servers.baseplate]',
        'command = "pnpm"',
        'args = ["run", "baseplate", "mcp"]',
        '```',
      ].join('\n'),
    );
  });
});

describe('buildAgentDocsList', () => {
  it('always includes the built-in baseplate.md and authorization.md links', () => {
    expect(buildAgentDocsList([])).toBe(
      [
        '- See `.agents/baseplate.md` for how to use the Baseplate MCP server, modify data models, and manage plugins',
        '- See `.agents/authorization.md` for the authorization model and the expression DSL used by model roles',
      ].join('\n'),
    );
  });

  it('appends a link per contributed doc', () => {
    expect(
      buildAgentDocsList([
        {
          id: 'storage-file-categories',
          description: 'how to configure and use file storage categories',
          content: '# File Storage Categories',
        },
      ]),
    ).toBe(
      [
        '- See `.agents/baseplate.md` for how to use the Baseplate MCP server, modify data models, and manage plugins',
        '- See `.agents/authorization.md` for the authorization model and the expression DSL used by model roles',
        '- See `.agents/storage-file-categories.md` for how to configure and use file storage categories',
      ].join('\n'),
    );
  });
});
