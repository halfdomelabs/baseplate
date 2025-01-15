// @ts-nocheck

import type { FormatFunction, NonOverwriteableMap } from '@halfdomelabs/sync';
import type { Plugin } from 'prettier';

import {
  createGeneratorWithTasks,
  createNonOverwriteableMap,
  createProviderType,
  writeJsonAction,
} from '@halfdomelabs/sync';

import { projectScope } from '@src/providers/scopes.js';

import { nodeProvider } from '../node/index.js';

const descriptorSchema = z.object({
  tabWidth: z.number().default(2),
});

export interface PrettierProvider {
  getConfig(): NonOverwriteableMap<PrettierConfig>;
}

export const prettierProvider =
  createProviderType<PrettierProvider>('prettier');

const PrettierGenerator = createGeneratorWithTasks({
  descriptorSchema,
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: { node: nodeProvider },
      exports: {
        prettier: prettierProvider.export(projectScope),
      },
      run({ node }) {
        const prettierConfig = createNonOverwriteableMap<PrettierConfig>({
          tabWidth: descriptor.tabWidth,
        });
        return {
          providers: {
            prettier: {
              getConfig: () => prettierConfig,
            },
          },
          build: async (builder) => {
            builder.writeFile('test.txt', 'test');
          },
        };
      },
    });
  },
});

export default PrettierGenerator;
