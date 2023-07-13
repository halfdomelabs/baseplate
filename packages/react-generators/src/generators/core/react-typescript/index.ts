import {
  eslintProvider,
  typescriptConfigProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithChildren,
  writeJsonAction,
} from '@halfdomelabs/sync';
import { z } from 'zod';

const descriptorSchema = z.object({});

const ReactTypescriptGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    typescriptConfig: typescriptConfigProvider,
    eslint: eslintProvider,
  },
  createGenerator(descriptor, { typescriptConfig, eslint }) {
    typescriptConfig.setTypescriptVersion('5.0.4');
    typescriptConfig.setTypescriptCompilerOptions({
      target: 'ESNext',
      lib: ['dom', 'dom.iterable', 'esnext'],
      types: ['vite/client', 'vite-plugin-svgr/client'],
      allowJs: true,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      noFallthroughCasesInSwitch: true,
      module: 'esnext',
      moduleResolution: 'node',
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
      baseUrl: './',
    });
    typescriptConfig.addInclude('src');
    typescriptConfig.addReference({
      path: './tsconfig.node.json',
    });
    eslint
      .getConfig()
      .appendUnique('extraTsconfigProjects', './tsconfig.node.json');
    return {
      build: async (builder) => {
        await builder.apply(
          writeJsonAction({
            destination: 'tsconfig.node.json',
            contents: {
              compilerOptions: {
                composite: true,
                module: 'ESNext',
                moduleResolution: 'Node',
                allowSyntheticDefaultImports: true,
              },
              include: ['vite.config.ts'],
            },
          })
        );
      },
    };
  },
});

export default ReactTypescriptGenerator;
