import { createTextTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

const agentsMd = createTextTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'agents-md',
  source: {
    path: path.join(import.meta.dirname, '../templates/package/AGENTS.md'),
  },
  variables: {
    TPL_APPS_LIST: {
      description: 'Markdown list of applications with types and directories',
    },
    TPL_PROJECT_NAME: { description: 'Name of the project' },
  },
});

const baseplateMd = createTextTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'baseplate-md',
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/package/agents/baseplate.md',
    ),
  },
  variables: {
    TPL_MCP_SETUP_INSTRUCTIONS: {
      description: 'MCP setup commands for each enabled agent',
    },
  },
});

const claudeMd = createTextTemplateFile({
  fileOptions: { kind: 'singleton' },
  name: 'claude-md',
  source: {
    path: path.join(import.meta.dirname, '../templates/package/CLAUDE.md'),
  },
  variables: {},
});

export const DEV_AGENTS_CORE_DEV_AGENTS_CONFIG_TEMPLATES = {
  agentsMd,
  baseplateMd,
  claudeMd,
};
