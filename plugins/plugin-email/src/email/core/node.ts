import {
  appCompilerSpec,
  backendAppEntryType,
  buildPackageName,
  createPluginModule,
  LibraryUtils,
  pluginAppCompiler,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';

import type { EmailPluginDefinition } from './schema/plugin-definition.js';

import { TRANSACTIONAL_LIB_TYPE } from '../transactional-lib/index.js';
import { emailModuleGenerator } from './generators/index.js';

export default createPluginModule({
  name: 'node',
  dependencies: {
    appCompiler: appCompilerSpec,
  },
  initialize: ({ appCompiler }, { pluginKey }) => {
    appCompiler.compilers.push(
      pluginAppCompiler({
        pluginKey,
        appType: backendAppEntryType,
        compile: ({ appCompiler, projectDefinition }) => {
          const email = PluginUtils.configByKeyOrThrow(
            projectDefinition,
            pluginKey,
          ) as EmailPluginDefinition;

          const transactionalLibDefinition = LibraryUtils.byUniqueTypeOrThrow(
            projectDefinition,
            TRANSACTIONAL_LIB_TYPE,
          );
          appCompiler.addChildrenToFeature(email.emailFeatureRef, {
            emailModule: emailModuleGenerator({
              transactionalLibPackageName: buildPackageName(
                projectDefinition.settings.general,
                transactionalLibDefinition.name,
              ),
            }),
          });
        },
      }),
    );
  },
});
