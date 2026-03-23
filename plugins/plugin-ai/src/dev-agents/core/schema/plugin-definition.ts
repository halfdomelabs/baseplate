import type { def } from '@baseplate-dev/project-builder-lib';

import { definitionSchema } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const DEV_AGENT_VALUES = [
  'claude-code',
  'cursor',
  'gemini',
  'copilot',
] as const;

export type DevAgentValue = (typeof DEV_AGENT_VALUES)[number];

const DEV_AGENT_LABELS: Record<DevAgentValue, string> = {
  'claude-code': 'Claude Code',
  cursor: 'Cursor',
  gemini: 'Gemini CLI',
  copilot: 'GitHub Copilot',
};

export const DEV_AGENT_OPTIONS = DEV_AGENT_VALUES.map((value) => ({
  value,
  label: DEV_AGENT_LABELS[value],
}));

export const createDevAgentsPluginDefinitionSchema = definitionSchema(() =>
  z.object({
    enabledAgents: z
      .array(z.enum(DEV_AGENT_VALUES))
      .min(1, 'Select at least one AI agent')
      .prefault(['claude-code']),
    devAgentsOptions: z.object({}).prefault({}),
  }),
);

export type DevAgentsPluginDefinition = def.InferOutput<
  typeof createDevAgentsPluginDefinitionSchema
>;
export type DevAgentsPluginDefinitionInput = def.InferInput<
  typeof createDevAgentsPluginDefinitionSchema
>;
