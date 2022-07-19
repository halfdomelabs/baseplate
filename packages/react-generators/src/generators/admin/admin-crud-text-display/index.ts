import { TypescriptCodeUtils } from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import { z } from 'zod';
import { adminCrudDisplayContainerProvider } from '../_providers/admin-crud-display-container';

const descriptorSchema = z.object({
  modelField: z.string().min(1),
});

const AdminCrudTextDisplayGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    adminCrudDisplayContainer: adminCrudDisplayContainerProvider,
  },
  createGenerator({ modelField }, { adminCrudDisplayContainer }) {
    adminCrudDisplayContainer.addDisplay({
      content: (itemName) =>
        TypescriptCodeUtils.createExpression(`{${itemName}.${modelField}}`),
      graphQLFields: [{ name: modelField }],
    });
    return {
      build: async () => {},
    };
  },
});

export default AdminCrudTextDisplayGenerator;
