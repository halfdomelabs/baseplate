import { createTaskTestRunner, testAction } from '@baseplate-dev/sync';
import { describe, expect, it } from 'vitest';

import type { TsTemplateGroup } from '#src/renderers/index.js';

import { createTsTemplateFile } from '#src/renderers/index.js';

import { createTestNodeProvider } from '../node/index.js';
import { typescriptGenerator } from './typescript.generator.js';

describe('typescriptGenerator', () => {
  describe('fileTask', () => {
    const typescriptBundle = typescriptGenerator({});
    const typescriptConfig = {
      compilerOptions: {
        paths: {
          '@src/*': ['src/*'],
        },
        moduleResolution: 'node16' as const,
      },
      include: ['src'],
      exclude: ['**/node_modules', '**/dist'],
      references: [],
      extraSections: [],
    };

    const testTemplateFile = createTsTemplateFile({
      name: 'test-template',
      source: { contents: 'export const helper = () => {};' },
      variables: {},
    });

    const testTemplateFile2 = createTsTemplateFile({
      name: 'test-template-2',
      source: { contents: 'export const helper2 = () => {};' },
      variables: {},
    });

    const testTemplateGroup = {
      'test-utils': testTemplateFile,
      'test-utils-2': testTemplateFile2,
    } satisfies TsTemplateGroup;

    it('renders template files', async () => {
      const runner = createTaskTestRunner(typescriptBundle.tasks.file);
      const { nodeProvider } = createTestNodeProvider();
      const result = await runner.run(
        {
          typescriptConfig,
          node: nodeProvider,
        },
        async ({ typescriptFile }) => {
          // Test template file rendering
          const action = typescriptFile.renderTemplateFile({
            template: testTemplateFile,
            destination: 'src/utils/helpers.ts',
          });

          // Verify the action was created
          expect(action).toBeDefined();

          const actionResult = await testAction(action);
          expect(
            actionResult.files.get('src/utils/helpers.ts')?.contents,
          ).toEqual('export const helper = () => {};');
        },
      );

      expect(result.builderOutputs.files.size).toEqual(0);
    });

    it('handles lazy template files and package dependencies', async () => {
      const runner = createTaskTestRunner(typescriptBundle.tasks.file, {
        templateMetadataOptions: {
          includeTemplateMetadata: true,
          shouldGenerateMetadata: () => true,
        },
      });
      const { nodeProvider, nodeFieldMap } = createTestNodeProvider();

      const result = await runner.run(
        {
          typescriptConfig,
          node: nodeProvider,
        },
        async ({ typescriptFile }) => {
          const utilsTemplateFile = createTsTemplateFile({
            name: 'utils-template',
            source: { contents: 'export const helper = () => {};' },
            variables: {},
          });

          const dependencyTemplateFile = createTsTemplateFile({
            name: 'dependency-template',
            source: {
              contents:
                'import { helper } from "@/src/utils/helpers.ts"; console.log(helper());',
            },
            variables: {},
          });

          await testAction(
            typescriptFile.renderTemplateFile({
              template: dependencyTemplateFile,
              destination: 'src/index.ts',
            }),
          );

          // Add a lazy template with package dependencies
          typescriptFile.addLazyTemplateFile(
            {
              template: utilsTemplateFile,
              destination: 'src/utils/helpers.ts',
              generatorInfo: {
                name: 'lazy-generator',
                baseDirectory: '/test',
              },
            },
            {
              devPackages: {
                '@types/node': '^18.0.0',
              },
              prodPackages: {
                lodash: '^4.17.0',
              },
            },
          );
        },
      );

      expect(result.builderOutputs.files.size).toEqual(1);

      const utilsFileOutput = result.builderOutputs.files.get(
        'src/utils/helpers.ts',
      );

      expect(utilsFileOutput?.contents).toEqual(
        'export const helper = () => {};',
      );
      expect(utilsFileOutput?.options?.templateMetadata?.generator).toEqual(
        'lazy-generator',
      );

      const { packages } = nodeFieldMap.getValues();

      // Verify packages were added
      expect(packages).toEqual({
        dev: {
          '@types/node': '^18.0.0',
        },
        prod: {
          lodash: '^4.17.0',
        },
      });
    });

    it('renders template groups with correct module resolution', async () => {
      const runner = createTaskTestRunner(typescriptBundle.tasks.file);
      const { nodeProvider } = createTestNodeProvider();
      const result = await runner.run(
        {
          typescriptConfig,
          node: nodeProvider,
        },
        async ({ typescriptFile }) => {
          const action = typescriptFile.renderTemplateGroup({
            group: testTemplateGroup,
            paths: {
              'test-utils': '@/src/utils/helpers.ts',
              'test-utils-2': '@/src/utils/helpers2.ts',
            },
          });

          const { files } = await testAction(action);
          expect(files.size).toEqual(2);
          expect(files.get('src/utils/helpers.ts')?.contents).toEqual(
            'export const helper = () => {};',
          );
          expect(files.get('src/utils/helpers2.ts')?.contents).toEqual(
            'export const helper2 = () => {};',
          );
        },
      );

      expect(result.builderOutputs.files.size).toEqual(0);
    });
  });
});
