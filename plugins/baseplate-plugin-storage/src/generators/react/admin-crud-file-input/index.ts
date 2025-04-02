import { TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import { adminCrudInputContainerProvider } from '@halfdomelabs/react-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { uploadComponentsProvider } from '../upload-components/index.js';

const descriptorSchema = z.object({
  label: z.string().min(1),
  modelRelation: z.string().min(1),
  isOptional: z.boolean().optional(),
  category: z.string().min(1),
});

export const adminCrudFileInputGenerator = createGenerator({
  name: 'react/admin-crud-file-input',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.modelRelation,
  buildTasks: ({ label, modelRelation, isOptional, category }) => [
    createGeneratorTask({
      name: 'main',
      dependencies: {
        adminCrudInputContainer: adminCrudInputContainerProvider,
        uploadComponents: uploadComponentsProvider,
      },
      run({ adminCrudInputContainer, uploadComponents }) {
        adminCrudInputContainer.addInput({
          content: TypescriptCodeUtils.createExpression(
            `<FileInput.LabelledController
          label="${label}"
          category="${category}"
          control={control}
          name="${modelRelation}"
        />`,
            'import { FileInput } from "%upload-components/file-input"',
            {
              importMappers: [uploadComponents],
            },
          ),
          graphQLFields: [
            {
              name: modelRelation,
              fields: [{ type: 'spread', on: 'FileInput' }],
            },
          ],
          validation: [
            {
              key: modelRelation,
              expression: TypescriptCodeUtils.createExpression(
                `z.object({ id: z.string(), name: z.string().nullish() })${
                  isOptional ? '.nullish()' : ''
                }`,
              ),
            },
          ],
        });

        return {};
      },
    }),
  ],
});
