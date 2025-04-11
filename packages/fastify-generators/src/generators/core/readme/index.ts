import { projectProvider } from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  renderTextTemplateFileAction,
} from '@halfdomelabs/sync';
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
        project: projectProvider,
      },
      run({ project }) {
        const projectName = descriptor.projectName ?? project.getProjectName();

        return {
          build: async (builder) => {
            await builder.apply(
              renderTextTemplateFileAction({
                template: CORE_README_TEXT_TEMPLATES.ReadmeTextTemplate,
                id: 'readme',
                destination: 'README.md',
                variables: {
                  TPL_PROJECT: projectName,
                },
                options: {
                  shouldFormat: true,
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
