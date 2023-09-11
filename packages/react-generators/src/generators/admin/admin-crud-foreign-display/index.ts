import { TypescriptCodeUtils } from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';
import { reactApolloProvider } from '@src/generators/apollo/react-apollo/index.js';
import { adminCrudDisplayContainerProvider } from '../_providers/admin-crud-display-container.js';
import { createForeignDataDependency } from '../_utils/foreign-data-dependency.js';

const descriptorSchema = z.object({
  localField: z.string().min(1),
  isOptional: z.boolean().optional(),
  foreignModelName: z.string().min(1),
  labelExpression: z.string().min(1),
  valueExpression: z.string().min(1),
});

type Descriptor = z.infer<typeof descriptorSchema>;

export type AdminCrudForeignDisplayProvider = unknown;

export const adminCrudForeignDisplayProvider =
  createProviderType<AdminCrudForeignDisplayProvider>(
    'admin-crud-foreign-display',
  );

const createMainTask = createTaskConfigBuilder(
  ({
    localField,
    isOptional,
    foreignModelName,
    labelExpression,
    valueExpression,
  }: Descriptor) => ({
    name: 'main',
    dependencies: {
      adminCrudDisplayContainer: adminCrudDisplayContainerProvider,
      reactApollo: reactApolloProvider,
    },
    exports: {
      adminCrudForeignDisplay: adminCrudForeignDisplayProvider,
    },
    run({ adminCrudDisplayContainer, reactApollo }) {
      const modelName = adminCrudDisplayContainer.getModelName();

      const { dataDependency, propName } = createForeignDataDependency({
        foreignModelName,
        modelName,
        reactApollo,
        labelExpression,
        valueExpression,
      });

      adminCrudDisplayContainer.addDisplay({
        content: (itemName) => {
          const optionalClause = isOptional
            ? `${itemName}.${localField} == null ? "None" : `
            : '';
          return TypescriptCodeUtils.createExpression(`{
            ${optionalClause}
            ${propName}.find(option => option.${valueExpression} === ${itemName}.${localField})?.${labelExpression}
            || "Unknown Item"}`);
        },
        graphQLFields: [{ name: localField }],
        dataDependencies: [dataDependency],
      });

      return {
        getProviders: () => ({
          adminCrudForeignDisplay: {},
        }),
      };
    },
  }),
);

const AdminCrudForeignDisplayGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default AdminCrudForeignDisplayGenerator;
