import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { doubleQuot } from '@src/utils/string.js';

import { prismaModelProvider } from '../prisma-model/index.js';

const REFERENTIAL_ACTIONS = [
  'Cascade',
  'Restrict',
  'NoAction',
  'SetNull',
  'SetDefault',
] as const;

const descriptorSchema = z.object({
  name: z.string().min(1),
  fields: z.array(z.string().min(1)),
  references: z.array(z.string().min(1)),
  modelName: z.string().min(1),
  foreignModelName: z.string().min(1),
  foreignRelationName: z.string().optional(),
  relationshipName: z.string().optional(),
  relationshipType: z.enum(['oneToOne', 'oneToMany']).default('oneToMany'),
  optional: z.boolean().default(false),
  onDelete: z.enum(REFERENTIAL_ACTIONS).default('Cascade'),
  onUpdate: z.enum(REFERENTIAL_ACTIONS).default('Restrict'),
});

export const prismaRelationFieldGenerator = createGenerator({
  name: 'prisma/prisma-relation-field',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => descriptor.name,
  buildTasks: (descriptor) => ({
    main: createGeneratorTask({
      dependencies: {
        prismaModel: prismaModelProvider
          .dependency()
          .reference(descriptor.modelName),
        foreignModel: prismaModelProvider
          .dependency()
          .reference(descriptor.foreignModelName),
      },
      run({ prismaModel, foreignModel }) {
        const {
          name,
          fields,
          references,
          foreignRelationName,
          relationshipName,
          relationshipType,
          optional,
          onDelete,
          onUpdate,
        } = descriptor;

        const isManyToOne = relationshipType === 'oneToMany';
        const modelName = foreignModel.getName();

        prismaModel.addField({
          name,
          type: `${modelName}${optional ? '?' : ''}`,
          fieldType: 'relation',
          attributes: [
            {
              name: '@relation',
              args: [
                ...(relationshipName ? [doubleQuot(relationshipName)] : []),
                {
                  fields,
                  references,
                  onDelete,
                  onUpdate,
                },
              ],
            },
          ],
        });

        if (foreignRelationName) {
          foreignModel.addField({
            name: foreignRelationName,
            type: `${prismaModel.getName()}${isManyToOne ? '[]' : '?'}`,
            fieldType: 'relation',
            attributes: relationshipName
              ? [{ name: '@relation', args: [doubleQuot(relationshipName)] }]
              : [],
          });
        }

        return {};
      },
    }),
  }),
});
