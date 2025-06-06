import { packageInfoProvider } from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  renderTextTemplateFileAction,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { CORE_README_TEXT_TEMPLATES } from './generated/text-templates.js';

const descriptorSchema = z.object({
  projectName: z.string().optional(),
});

export const readmeGenerator = createGenerator({
  name: 'core/readme',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: (descriptor) => ({
    main: createGeneratorTask({
      dependencies: {
        packageInfo: packageInfoProvider,
      },
      run({ packageInfo }) {
        const projectName =
          descriptor.projectName ?? packageInfo.getPackageName();

        return {
          build: async (builder) => {
            await builder.apply(
              renderTextTemplateFileAction({
                template: CORE_README_TEXT_TEMPLATES.readme,
                destination: 'README.md',
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
