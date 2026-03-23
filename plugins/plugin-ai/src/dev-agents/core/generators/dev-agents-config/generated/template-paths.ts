import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface DevAgentsCoreDevAgentsConfigPaths {
  agentsMd: string;
  baseplateMd: string;
  claudeMd: string;
}

const devAgentsCoreDevAgentsConfigPaths =
  createProviderType<DevAgentsCoreDevAgentsConfigPaths>(
    'dev-agents-core-dev-agents-config-paths',
  );

const devAgentsCoreDevAgentsConfigPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: {
    devAgentsCoreDevAgentsConfigPaths:
      devAgentsCoreDevAgentsConfigPaths.export(),
  },
  run({ packageInfo }) {
    const packageRoot = packageInfo.getPackageRoot();

    return {
      providers: {
        devAgentsCoreDevAgentsConfigPaths: {
          agentsMd: `${packageRoot}/AGENTS.md`,
          baseplateMd: `${packageRoot}/.agents/baseplate.md`,
          claudeMd: `${packageRoot}/CLAUDE.md`,
        },
      },
    };
  },
});

export const DEV_AGENTS_CORE_DEV_AGENTS_CONFIG_PATHS = {
  provider: devAgentsCoreDevAgentsConfigPaths,
  task: devAgentsCoreDevAgentsConfigPathsTask,
};
