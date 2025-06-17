import type { TemplateExtractorContext } from '@baseplate-dev/sync/extractor-v2';

import { TEMPLATE_EXTRACTOR_GENERATED_DIRECTORY } from '@baseplate-dev/sync/extractor-v2';
import { mapValuesOfMap } from '@baseplate-dev/utils';
import { posixJoin } from '@baseplate-dev/utils/node';
import { camelCase } from 'change-case';
import { z } from 'zod';

import type { TsCodeFragment } from '#src/renderers/typescript/index.js';

import {
  getGeneratedTemplateConstantName,
  getGeneratedTemplateExportName,
  getGeneratedTemplateInterfaceName,
  getGeneratedTemplateProviderName,
  resolvePackagePathSpecifier,
} from '#src/renderers/extractor/utils/index.js';
import {
  renderTsCodeFileTemplate,
  TsCodeUtils,
  tsImportBuilder,
  tsTemplate,
} from '#src/renderers/typescript/index.js';

export const GENERATED_PATHS_FILE_NAME = 'template-paths.ts';

const GENERATED_PATHS_FILE_PATH = posixJoin(
  TEMPLATE_EXTRACTOR_GENERATED_DIRECTORY,
  GENERATED_PATHS_FILE_NAME,
);

const GENERATED_PATHS_TEMPLATE = `
import { createProviderType } from '@baseplate-dev/sync';

export interface TPL_PATHS_TYPE_NAME {
  TPL_PATHS_CONTENTS;
}

const TPL_PATHS_PROVIDER_EXPORT = createProviderType<TPL_PATHS_TYPE_NAME>('TPL_PATHS_PROVIDER_NAME');

TPL_PATHS_TASK_DECLARATION

export const TPL_PATHS_EXPORT_NAME = {
  provider: TPL_PATHS_PROVIDER_EXPORT,
  TPL_PATHS_TASK_EXPORT
}
`;

const PATH_ROOT_REGEX = /^{([^}]+)}/;

const pathProviderConfigSchema = z.object({
  type: z.literal('path'),
  /**
   * The path roots offered by this provider.
   */
  pathRoots: z.array(
    z.object({
      /**
       * The name of the path root e.g. `feature-root
       */
      name: z.string().min(1),
      /**
       * The method to get the path root, e.g. `getDirectoryBase`
       */
      method: z.string().min(1),
    }),
  ),
});

interface PathsFileExportNames {
  interfaceName: string;
  providerExportName: string;
  taskName: string;
  rootExportName: string;
}

export function getPathsFileExportNames(
  generatorName: string,
): PathsFileExportNames {
  return {
    interfaceName: getGeneratedTemplateInterfaceName(generatorName, 'paths'),
    providerExportName: getGeneratedTemplateExportName(generatorName, 'paths'),
    taskName: getGeneratedTemplateExportName(generatorName, 'paths-task'),
    rootExportName: getGeneratedTemplateConstantName(generatorName, 'paths'),
  };
}

function createPathsTask(
  generatorName: string,
  pathMap: Map<string, string>,
  context: TemplateExtractorContext,
  { providerExportName }: PathsFileExportNames,
): TsCodeFragment {
  const extractorConfig =
    context.configLookup.getExtractorConfigOrThrow(generatorName);
  const allPathProviders = context.configLookup.getProviderConfigsByType(
    'path',
    pathProviderConfigSchema,
  );

  const pathRootsUsed = new Set<string>();

  for (const [, pathRootRelativePath] of pathMap) {
    // Extract all the path roots used of the form {path-root-name}/...
    const pathRootMatches = PATH_ROOT_REGEX.exec(pathRootRelativePath);
    if (!pathRootMatches) {
      throw new Error(
        `Path root relative path ${pathRootRelativePath} does not contain a path root`,
      );
    }
    pathRootsUsed.add(pathRootMatches[1]);
  }

  const pathProviders = allPathProviders
    .filter(({ config }) =>
      config.pathRoots.some((p) => pathRootsUsed.has(p.name)),
    )
    .map((p) => ({
      providerName: p.providerName,
      providerVariableName: camelCase(p.providerName.replace(/Provider$/, '')),
      providerPathSpecifier: p.packagePathSpecifier,
      pathRoots: p.config.pathRoots
        .filter((root) => pathRootsUsed.has(root.name))
        .map((root) => ({
          name: root.name,
          variableName: camelCase(root.name),
          methodName: root.method,
        })),
    }));

  const dependencies = TsCodeUtils.mergeFragmentsAsObject(
    Object.fromEntries(
      pathProviders.map((p) => [
        p.providerVariableName,
        TsCodeUtils.importFragment(
          p.providerName,
          resolvePackagePathSpecifier(
            p.providerPathSpecifier,
            extractorConfig.packageName,
          ),
        ),
      ]),
    ),
  );

  const providerVariableName = providerExportName.replace(/Provider$/, '');

  const exports = TsCodeUtils.mergeFragmentsAsObject({
    [providerVariableName]: `${providerExportName}.export()`,
  });

  const pathRootDeclarations = TsCodeUtils.mergeFragments(
    new Map(
      pathProviders.flatMap((p) =>
        p.pathRoots.map(({ methodName, variableName }) => [
          variableName,
          tsTemplate`const ${variableName} = ${p.providerVariableName}.${methodName}()`,
        ]),
      ),
    ),
    '\n',
  ).contents;

  const pathRootLookup = Object.fromEntries(
    pathProviders.flatMap((p) =>
      p.pathRoots.map((r) => [r.name, r.variableName]),
    ),
  );

  const pathsContents = TsCodeUtils.mergeFragmentsAsObject(
    mapValuesOfMap(pathMap, (pathRootRelativePath) => {
      const resolvedPath = pathRootRelativePath.replace(
        PATH_ROOT_REGEX,
        (pathRootPlaceholder) => {
          const pathRootName = pathRootPlaceholder.slice(1, -1);
          const pathRootVariableName = pathRootLookup[pathRootName];
          if (!pathRootVariableName) {
            throw new Error(
              `Path root ${pathRootName} not found in path root lookup. Ensure it is registered with the providers.json file.`,
            );
          }
          return `$\{${pathRootVariableName}}`;
        },
      );
      return `\`${resolvedPath}\``;
    }),
  );

  const run = tsTemplate`
  function run({ ${pathProviders.map((p) => p.providerVariableName).join(', ')} }) {
    ${pathRootDeclarations}

    return {
      providers: {
        ${providerExportName}: ${pathsContents}
      }
    }
  }
  `;

  return TsCodeUtils.mergeFragmentsAsObject({
    dependencies,
    exports,
    run,
  });
}

export async function writePathMapFile(
  generatorName: string,
  pathMap: Map<string, string>,
  context: TemplateExtractorContext,
  options: { skipTaskGeneration?: boolean } = {},
): Promise<{ exportName: string }> {
  const extractorConfig =
    context.configLookup.getExtractorConfigOrThrow(generatorName);
  const pathMapPath = posixJoin(
    extractorConfig.generatorDirectory,
    GENERATED_PATHS_FILE_PATH,
  );

  const fileExportNames = getPathsFileExportNames(generatorName);
  const { interfaceName, providerExportName, taskName } = fileExportNames;

  const taskFragment = options.skipTaskGeneration
    ? null
    : createPathsTask(generatorName, pathMap, context, fileExportNames);

  const pathMapContents = renderTsCodeFileTemplate({
    templateContents: GENERATED_PATHS_TEMPLATE,
    variables: {
      TPL_PATHS_TYPE_NAME: interfaceName,
      TPL_PATHS_CONTENTS: [...pathMap]
        .map(([templateName]) => `'${templateName}': string`)
        .join(',\n'),
      TPL_PATHS_PROVIDER_EXPORT: providerExportName,
      TPL_PATHS_PROVIDER_NAME: getGeneratedTemplateProviderName(
        generatorName,
        'paths',
      ),
      TPL_PATHS_TASK_DECLARATION: taskFragment
        ? TsCodeUtils.templateWithImports([
            tsImportBuilder(['createGeneratorTask']).from(
              '@baseplate-dev/sync',
            ),
          ])`const ${taskName} = createGeneratorTask(${taskFragment});`
        : '',
      TPL_PATHS_TASK_EXPORT: taskFragment ? `task: ${taskName},` : '',
      TPL_PATHS_EXPORT_NAME: fileExportNames.rootExportName,
    },
    options: {
      importSortOptions: {
        internalPatterns: [/^#src/],
      },
    },
  });

  await context.fileContainer.writeFile(pathMapPath, pathMapContents);

  return {
    exportName: fileExportNames.rootExportName,
  };
}
