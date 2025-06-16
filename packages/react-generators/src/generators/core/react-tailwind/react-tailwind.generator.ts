import {
  createNodePackagesTask,
  eslintConfigProvider,
  extractPackageVersions,
  prettierProvider,
  projectScope,
  renderTextTemplateGroupAction,
  tsCodeFragment,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import * as prettierPluginTailwindcss from 'prettier-plugin-tailwindcss';
import { z } from 'zod';

import { REACT_PACKAGES } from '#src/constants/react-packages.js';

import { reactBaseConfigProvider } from '../react/index.js';
import { CORE_REACT_TAILWIND_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  globalBodyClasses: z.string().optional(),
});

export interface ReactTailwindProvider {
  addGlobalStyle: (style: string) => void;
}

export const reactTailwindProvider =
  createProviderType<ReactTailwindProvider>('react-tailwind');

export const reactTailwindGenerator = createGenerator({
  name: 'core/react-tailwind',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ globalBodyClasses }) => ({
    nodePackages: createNodePackagesTask({
      dev: extractPackageVersions(REACT_PACKAGES, [
        'autoprefixer',
        'tailwindcss',
        'prettier-plugin-tailwindcss',
        '@tailwindcss/forms',
      ]),
    }),
    paths: CORE_REACT_TAILWIND_GENERATED.paths.task,
    main: createGeneratorTask({
      dependencies: {
        reactBaseConfig: reactBaseConfigProvider,
        eslintConfig: eslintConfigProvider,
        prettier: prettierProvider,
        paths: CORE_REACT_TAILWIND_GENERATED.paths.provider,
      },
      exports: {
        reactTailwind: reactTailwindProvider.export(projectScope),
      },
      run({ reactBaseConfig, eslintConfig, prettier, paths }) {
        eslintConfig.tsDefaultProjectFiles.push(
          'postcss.config.js',
          'tailwind.config.js',
        );

        prettier.addPlugin({
          name: 'prettier-plugin-tailwindcss',
          version: REACT_PACKAGES['prettier-plugin-tailwindcss'],
          default: prettierPluginTailwindcss,
        });

        reactBaseConfig.headerFragments.set(
          'INDEX_CSS_IMPORTS',
          tsCodeFragment("import './index.css'"),
        );

        const globalStyles: string[] = [];

        if (globalBodyClasses) {
          globalStyles.push(`body {
  @apply ${globalBodyClasses}
}`);
        }

        return {
          providers: {
            reactTailwind: {
              addGlobalStyle: (style) => {
                globalStyles.push(style);
              },
            },
          },
          build: async (builder) => {
            await builder.apply(
              renderTextTemplateGroupAction({
                group: CORE_REACT_TAILWIND_GENERATED.templates.mainGroup,
                paths,
                variables: {
                  indexCss: {
                    TPL_GLOBAL_STYLES:
                      globalStyles.length > 0 ||
                      !builder.metadataOptions.includeTemplateMetadata
                        ? globalStyles.join('\n\n')
                        : '/* GLOBAL_STYLES */',
                  },
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
