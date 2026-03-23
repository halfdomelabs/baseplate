import type { def } from '@baseplate-dev/project-builder-lib';

import { definitionSchema } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const DEV_AGENT_OPTIONS = [
  { value: 'claude-code', label: 'Claude Code' },
  { value: 'cursor', label: 'Cursor' },
  { value: 'gemini', label: 'Gemini CLI' },
  { value: 'copilot', label: 'GitHub Copilot' },
];

export const createDevAgentsPluginDefinitionSchema = definitionSchema(() =>
  z.object({
    enabledAgents: z
      .array(z.string())
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
