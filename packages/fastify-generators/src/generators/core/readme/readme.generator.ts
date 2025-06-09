import {
  packageInfoProvider,
  renderTextTemplateFileAction,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { CORE_README_PATHS } from './generated/template-paths.js';
import { CORE_README_TEMPLATES } from './generated/typed-templates.js';

const descriptorSchema = z.object({
  projectName: z.string().optional(),
});

export const readmeGenerator = createGenerator({
  name: 'core/readme',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: (descriptor) => ({
    paths: CORE_README_PATHS.task,
    main: createGeneratorTask({
      dependencies: {
        packageInfo: packageInfoProvider,
        paths: CORE_README_PATHS.provider,
      },
      run({ packageInfo, paths }) {
        const projectName =
          descriptor.projectName ?? packageInfo.getPackageName();

        return {
          build: async (builder) => {
            await builder.apply(
              renderTextTemplateFileAction({
                template: CORE_README_TEMPLATES.readme,
                destination: paths.readme,
                variables: {
                  TPL_PROJECT: projectName,
                },
                options: {
                  shouldNeverOverwrite: true,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
