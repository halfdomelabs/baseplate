import { tsCodeFragment, TsCodeUtils } from '@baseplate-dev/core-generators';
import { adminCrudInputContainerProvider } from '@baseplate-dev/react-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { uploadComponentsImportsProvider } from '../upload-components/index.js';

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
            'FileInputFieldController',
            {
              label,
              category,
              control: tsCodeFragment('control'),
              name: modelRelation,
            },
            uploadComponentsImports.FileInputFieldController.declaration(),
          ),
          graphQLFields: [
            {
              name: modelRelation,
              fields: [{ name: 'id' }],
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
