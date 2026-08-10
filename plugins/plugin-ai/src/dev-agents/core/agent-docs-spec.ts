import type {
  ProjectDefinition,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';

import { createFieldMapSpec } from '@baseplate-dev/project-builder-lib';
import { safeMerge } from '@baseplate-dev/utils';

export interface AgentDocDefinition {
  /** Kebab-case id, becomes `.agents/<id>.md` */
  id: string;
  /** One-line blurb used in the AGENTS.md link list */
  description: string;
  /** Full markdown file body, self-contained with its own heading */
  content: string;
}

interface AgentDocCompilerOptions {
  projectDefinition: ProjectDefinition;
  definitionContainer: ProjectDefinitionContainer;
}

export interface AgentDocCompiler {
  pluginKey: string;
  compile: (
    options: AgentDocCompilerOptions,
  ) => Record<string, AgentDocDefinition>;
}

export function agentDocCompiler(options: AgentDocCompiler): AgentDocCompiler {
  return options;
}

/**
 * Spec for registering AI agent reference docs (e.g. `.agents/<id>.md`,
 * linked from AGENTS.md) contributed by plugins.
 */
export const agentDocsSpec = createFieldMapSpec(
  'core/agent-docs',
  (t) => ({
    compilers: t.array<AgentDocCompiler>(),
  }),
  {
    use: (values) => ({
      compileAll(options: AgentDocCompilerOptions): AgentDocDefinition[] {
        let result: Record<string, AgentDocDefinition> = {};
        for (const compiler of values.compilers) {
          result = safeMerge(result, compiler.compile(options));
        }
        return Object.values(result);
      },
    }),
  },
);
