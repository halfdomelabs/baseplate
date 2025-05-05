import { tsCodeFragment, TsCodeUtils } from '@halfdomelabs/core-generators';
import { adminCrudInputContainerProvider } from '@halfdomelabs/react-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { uploadComponentsImportsProvider } from '../upload-components/upload-components.generator';

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
        uploadComponentsImports: uploadComponentsImportsProvider,
      },
      run({ adminCrudInputContainer, uploadComponentsImports }) {
        adminCrudInputContainer.addInput({
          order,
          content: TsCodeUtils.mergeFragmentsAsJsxElement(
            'FileInput.LabelledController',
            {
              label,
              category,
              control: tsCodeFragment('control'),
              name: modelRelation,
            },
            uploadComponentsImports.FileInput.declaration(),
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
