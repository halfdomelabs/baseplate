import {
  createNodePackagesTask,
  eslintConfigProvider,
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
  lightColorsCss: z.string().optional(),
  darkColorsCss: z.string().optional(),
  /**
   * Whether to wire up the Vite plugin and stylesheet import for a bundled app.
   *
   * Disable for packages with no Vite build (e.g. tsc-only libraries), which only
   * need the stylesheet template and Tailwind tooling (eslint/prettier) rendered.
   *
   * @default true
   */
  includeViteIntegration: z.boolean().optional(),
});

export interface ReactTailwindProvider {
  addGlobalStyle: (style: string) => void;
  addSourceGlob: (path: string) => void;
}

export const reactTailwindProvider =
  createProviderType<ReactTailwindProvider>('react-tailwind');

export const reactTailwindGenerator = createGenerator({
  name: 'core/react-tailwind',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({
    globalBodyClasses,
    lightColorsCss,
    darkColorsCss,
    includeViteIntegration = true,
  }) => ({
    nodePackages: createNodePackagesTask({
      dev: extractPackageVersions(REACT_PACKAGES, [
        ...(includeViteIntegration ? (['@tailwindcss/vite'] as const) : []),
        'tailwindcss',
        'prettier-plugin-tailwindcss',
        'tw-animate-css',
      ]),
    }),
    prettier: createProviderTask(prettierProvider, (prettier) => {
      prettier.addPlugin({
        name: 'prettier-plugin-tailwindcss',
        version: REACT_PACKAGES['prettier-plugin-tailwindcss'],
        default: prettierPluginTailwindcss,
      });
      prettier.addExtraOptions({
        tailwindFunctions: ['clsx', 'cn', 'cva'],
        tailwindStylesheet: './src/styles.css',
      });
      // The plugin learns the project's utilities by reading the stylesheet from
      // disk, which during a sync still holds the previous version. Both files
      // are mirrored so the stylesheet's `@import './typeset.css'` still
      // resolves from the mirror; a new cross-package import would need adding
      // here too.
      prettier.addMaterializedFormatterInput({
        path: 'src/styles.css',
        buildOptions: (materializedPath) => ({
          tailwindStylesheet: materializedPath,
        }),
      });
      prettier.addMaterializedFormatterInput({ path: 'src/typeset.css' });
    }),
    eslint: createProviderTask(eslintConfigProvider, (eslintConfig) => {
      eslintConfig.tailwind.set(true);
    }),
    paths: CORE_REACT_TAILWIND_GENERATED.paths.task,
    ...(includeViteIntegration
      ? {
          vite: createGeneratorTask({
            dependencies: { reactBaseConfig: reactBaseConfigProvider },
            run({ reactBaseConfig }) {
              reactBaseConfig.vitePlugins.set(
                '@tailwindcss/vite',
                tsTemplate`${TsCodeUtils.defaultImportFragment(
                  'tailwindcss',
                  '@tailwindcss/vite',
                )}()`,
              );
              reactBaseConfig.headerImportFragments.set(
                'styles-css-import',
                tsCodeFragment("import './styles.css'"),
              );
            },
          }),
        }
      : {}),
    main: createGeneratorTask({
      dependencies: {
        paths: CORE_REACT_TAILWIND_GENERATED.paths.provider,
      },
      exports: {
        reactTailwind: reactTailwindProvider.export(packageScope),
      },
      run({ paths }) {
        const globalStyles: string[] = [];
        const sourceGlobs = new Set<string>();

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
              addSourceGlob: (path) => {
                sourceGlobs.add(path);
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
                    TPL_LIGHT_COLORS: lightColorsCss ?? '',
                    TPL_DARK_COLORS: darkColorsCss ?? '',
                    TPL_SOURCE_DIRECTIVES:
                      sourceGlobs.size > 0 ||
                      !builder.metadataOptions.includeTemplateMetadata
                        ? [...sourceGlobs]
                            .toSorted()
                            .map((path) => `@source '${path}';`)
                            .join('\n')
                        : '/* SOURCE_DIRECTIVES */',
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
