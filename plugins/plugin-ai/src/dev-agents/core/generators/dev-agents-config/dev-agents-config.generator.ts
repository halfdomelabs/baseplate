import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import type { DevAgentValue } from '../../schema/plugin-definition.js';

import { DEV_AGENT_VALUES } from '../../schema/plugin-definition.js';
import { DEV_AGENTS_CORE_DEV_AGENTS_CONFIG_GENERATED as GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  enabledAgents: z.array(z.enum(DEV_AGENT_VALUES)),
  projectName: z.string(),
  apps: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      directory: z.string(),
    }),
  ),
  pluginDocs: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      content: z.string(),
    }),
  ),
});

type Descriptor = z.infer<typeof descriptorSchema>;

// ---------------------------------------------------------------------------
// Variable builders
// ---------------------------------------------------------------------------

export function buildAppsList(apps: Descriptor['apps']): string {
  return apps
    .map((a) => `- **${a.name}** — \`${a.type}\` app in \`${a.directory}/\``)
    .join('\n');
}

const MCP_SETUP_COMMANDS: Record<DevAgentValue, string> = {
  'claude-code': [
    '**Claude Code:**',
    '```bash',
    'claude mcp add baseplate -- pnpm baseplate mcp',
    '```',
  ].join('\n'),
  codex: [
    '**Codex:** Add to `.codex/config.toml`:',
    '```toml',
    '[mcp_servers.baseplate]',
    'command = "pnpm"',
    'args = ["run", "baseplate", "mcp"]',
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
    'gemini mcp add baseplate -- pnpm baseplate mcp',
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
            args: ['baseplate', 'mcp'],
          },
        },
      },
      null,
      2,
    ),
    '```',
  ].join('\n'),
};

const BASE_AGENT_DOCS_LINKS = [
  '- See `.agents/baseplate.md` for how to use the Baseplate MCP server, modify data models, and manage plugins',
  '- See `.agents/authorization.md` for the authorization model and the expression DSL used by model roles',
];

// Always includes the base links so the value is never empty — an empty
// template variable value breaks the extractor's ability to locate it.
export function buildAgentDocsList(docs: Descriptor['pluginDocs']): string {
  return [
    ...BASE_AGENT_DOCS_LINKS,
    ...docs.map(
      (doc) => `- See \`.agents/${doc.id}.md\` for ${doc.description}`,
    ),
  ].join('\n');
}

export function buildMcpSetupInstructions(
  enabledAgents: DevAgentValue[],
): string {
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
                  TPL_APPS_LIST: buildAppsList(descriptor.apps),
                  TPL_AGENT_DOCS_LIST: buildAgentDocsList(
                    descriptor.pluginDocs,
                  ),
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

            // Always generate .agents/authorization.md
            await builder.apply(renderers.authorizationMd.render({}));

            // Conditionally generate Claude-specific files
            if (descriptor.enabledAgents.includes('claude-code')) {
              await builder.apply(renderers.claudeMd.render({}));
            }

            // Generate plugin-contributed reference docs
            for (const doc of descriptor.pluginDocs) {
              builder.writeFile({
                id: `plugin-doc-${doc.id}`,
                destination: `.agents/${doc.id}.md`,
                contents: doc.content,
              });
            }
          },
        };
      },
    }),
  }),
});
