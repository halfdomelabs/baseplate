import { describe, expect, it } from 'vitest';

import { buildMcpSetupInstructions } from './dev-agents-config.generator.js';

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
