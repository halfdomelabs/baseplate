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
    typescriptConfig.setTypescriptVersion('5.5.4');
    typescriptConfig.setTypescriptCompilerOptions({
      /* Compilation */
      lib: ['DOM', 'DOM.Iterable', 'ESNext'],
      module: 'ESNext',
      target: 'ESNext',
      skipLibCheck: true,
      esModuleInterop: false,
      allowJs: false,
      jsx: 'react-jsx',

      /* Linting */
      strict: true,

      /* Resolution */
      allowSyntheticDefaultImports: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      moduleResolution: 'Bundler',

      /* Output */
      isolatedModules: true,
      noEmit: true,

      /* Paths */
      baseUrl: './',
      paths: {
        '@src/*': ['./src/*'],
      },
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
                moduleResolution: 'Node',
              },
              include: ['vite.config.ts'],
            },
          }),
        );
      },
    };
  },
});

export default ReactTypescriptGenerator;
