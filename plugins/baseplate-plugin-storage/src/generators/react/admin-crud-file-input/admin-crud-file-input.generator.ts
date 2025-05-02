import { tsCodeFragment, tsImportBuilder } from '@halfdomelabs/core-generators';
import { adminCrudInputContainerProvider } from '@halfdomelabs/react-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { uploadComponentsProvider } from '../upload-components/upload-components.generator';

const descriptorSchema = z.object({
  order: z.number(),
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
  buildTasks: ({ order, label, modelRelation, isOptional, category }) => ({
    main: createGeneratorTask({
      dependencies: {
        adminCrudInputContainer: adminCrudInputContainerProvider,
        uploadComponents: uploadComponentsProvider,
      },
      run({ adminCrudInputContainer, uploadComponents }) {
        adminCrudInputContainer.addInput({
          order,
          content: tsCodeFragment(
            `<FileInput.LabelledController
          label="${label}"
          category="${category}"
          control={control}
          name="${modelRelation}"
        />`,
            tsImportBuilder(['FileInput']).from(
              uploadComponents.getImportMap()['%upload-components/file-input']
                ?.path ?? '',
            ),
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
              expression: tsCodeFragment(
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
  }),
});
