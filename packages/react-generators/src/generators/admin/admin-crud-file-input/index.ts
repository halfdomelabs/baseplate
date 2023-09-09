import { TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import { z } from 'zod';
import { uploadComponentsProvider } from '@src/generators/storage/upload-components/index.js';
import { adminCrudInputContainerProvider } from '../_providers/admin-crud-input-container.js';

const descriptorSchema = z.object({
  label: z.string().min(1),
  modelRelation: z.string().min(1),
  isOptional: z.boolean().optional(),
  category: z.string().min(1),
});

const AdminCrudFileInputGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    adminCrudInputContainer: adminCrudInputContainerProvider,
    uploadComponents: uploadComponentsProvider,
  },
  createGenerator(
    { label, modelRelation, isOptional, category },
    { adminCrudInputContainer, uploadComponents }
  ) {
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
        }
      ),
      graphQLFields: [
        { name: modelRelation, fields: [{ type: 'spread', on: 'FileInput' }] },
      ],
      validation: [
        {
          key: modelRelation,
          expression: TypescriptCodeUtils.createExpression(
            `z.object({ id: z.string(), name: z.string().nullish() })${
              isOptional ? '.nullish()' : ''
            }`
          ),
        },
      ],
    });

    return {};
  },
});

export default AdminCrudFileInputGenerator;
