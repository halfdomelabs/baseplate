import {
  createNodePackagesTask,
  extractPackageVersions,
  packageScope,
  prettierProvider,
  renderTextTemplateGroupAction,
  tsCodeFragment,
  TsCodeUtils,
  tsTemplate,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
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
        '@tailwindcss/vite',
        'tailwindcss',
        'prettier-plugin-tailwindcss',
        'tw-animate-css',
      ]),
    }),
    paths: CORE_REACT_TAILWIND_GENERATED.paths.task,
    vite: createProviderTask(reactBaseConfigProvider, (reactBaseConfig) => {
      reactBaseConfig.vitePlugins.set(
        '@tailwindcss/vite',
        tsTemplate`${TsCodeUtils.defaultImportFragment(
          'tailwindcss',
          '@tailwindcss/vite',
        )}()`,
      );
    }),
    main: createGeneratorTask({
      dependencies: {
        reactBaseConfig: reactBaseConfigProvider,
        prettier: prettierProvider,
        paths: CORE_REACT_TAILWIND_GENERATED.paths.provider,
      },
      exports: {
        reactTailwind: reactTailwindProvider.export(packageScope),
      },
      run({ reactBaseConfig, prettier, paths }) {
        prettier.addPlugin({
          name: 'prettier-plugin-tailwindcss',
          version: REACT_PACKAGES['prettier-plugin-tailwindcss'],
          default: prettierPluginTailwindcss,
        });

        reactBaseConfig.headerFragments.set(
          'styles-css-import',
          tsCodeFragment("import './styles.css'"),
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
                  stylesCss: {
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
