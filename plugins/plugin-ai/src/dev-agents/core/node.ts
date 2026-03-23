import {
  createPluginModule,
  getPackageDirectory,
  PluginUtils,
  rootCompilerSpec,
} from '@baseplate-dev/project-builder-lib';

import type { DevAgentsPluginDefinition } from './schema/plugin-definition.js';

import { devAgentsConfigGenerator } from './generators/dev-agents-config/index.js';

export default createPluginModule({
  name: 'node',
  dependencies: {
    rootCompiler: rootCompilerSpec,
  },
  initialize: ({ rootCompiler }, { pluginKey }) => {
    rootCompiler.compilers.push({
      pluginKey,
      compile: ({ projectDefinition }) => {
        const config = PluginUtils.configByKeyOrThrow(
          projectDefinition,
          pluginKey,
        ) as DevAgentsPluginDefinition;

        const generalSettings = projectDefinition.settings.general;
        const monorepoSettings = projectDefinition.settings.monorepo;

        return {
          devAgentsConfig: devAgentsConfigGenerator({
            enabledAgents: config.enabledAgents,
            projectName: generalSettings.name,
            apps: projectDefinition.apps.map((a) => ({
              name: a.name,
              type: a.type,
              directory: getPackageDirectory(monorepoSettings, a.name, 'app'),
            })),
          }),
        };
      },
    });
  },
});
