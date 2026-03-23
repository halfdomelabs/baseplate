import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { DEV_AGENTS_CORE_DEV_AGENTS_CONFIG_GENERATED as GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  enabledAgents: z.array(z.string()),
  projectName: z.string(),
  apps: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      directory: z.string(),
    }),
  ),
});

type Descriptor = z.infer<typeof descriptorSchema>;

// ---------------------------------------------------------------------------
// Variable builders
// ---------------------------------------------------------------------------

function buildAppsList(descriptor: Descriptor): string {
  return descriptor.apps
    .map((a) => `- **${a.name}** — \`${a.type}\` app in \`${a.directory}/\``)
    .join('\n');
}

const MCP_SETUP_COMMANDS: Record<string, string> = {
  'claude-code': [
    '**Claude Code:**',
    '```bash',
    'claude mcp add baseplate -- pnpm run baseplate mcp',
    '```',
  ].join('\n'),
  cursor: [
    '**Cursor:** Add to `.cursor/mcp.json`:',
    '```json',
    JSON.stringify(
      {
        mcpServers: {
          baseplate: {
            command: 'pnpm',
            args: ['run', 'baseplate', 'mcp'],
          },
        },
      },
      null,
      2,
    ),
    '```',
  ].join('\n'),
  gemini: [
    '**Gemini CLI:**',
    '```bash',
    'gemini mcp add baseplate -- pnpm run baseplate mcp',
    '```',
  ].join('\n'),
  copilot: [
    '**GitHub Copilot (VS Code):** Add to `.vscode/mcp.json`:',
    '```json',
    JSON.stringify(
      {
        servers: {
          baseplate: {
            type: 'stdio',
            command: 'pnpm',
            args: ['run', 'baseplate', 'mcp'],
          },
        },
      },
      null,
      2,
    ),
    '```',
  ].join('\n'),
};

function buildMcpSetupInstructions(enabledAgents: string[]): string {
  return enabledAgents
    .map((agent) => MCP_SETUP_COMMANDS[agent])
    .filter(Boolean)
    .join('\n\n');
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

export const devAgentsConfigGenerator = createGenerator({
  name: 'dev-agents/core/dev-agents-config',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: (descriptor) => ({
    paths: GENERATED.paths.task,
    renderers: GENERATED.renderers.task,

    main: createGeneratorTask({
      dependencies: {
        renderers: GENERATED.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            // Always generate AGENTS.md
            await builder.apply(
              renderers.agentsMd.render({
                variables: {
                  TPL_PROJECT_NAME: descriptor.projectName,
                  TPL_APPS_LIST: buildAppsList(descriptor),
                },
              }),
            );

            // Always generate .agents/baseplate.md
            await builder.apply(
              renderers.baseplateMd.render({
                variables: {
                  TPL_MCP_SETUP_INSTRUCTIONS: buildMcpSetupInstructions(
                    descriptor.enabledAgents,
                  ),
                },
              }),
            );

            // Conditionally generate Claude-specific files
            if (descriptor.enabledAgents.includes('claude-code')) {
              await builder.apply(renderers.claudeMd.render({}));
            }
          },
        };
      },
    }),
  }),
});
