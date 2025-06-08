import type { TemplateExtractorContext } from '@baseplate-dev/sync/extractor-v2';

import { mapValuesOfMap } from '@baseplate-dev/utils';
import { posixJoin } from '@baseplate-dev/utils/node';
import { camelCase } from 'change-case';
import { z } from 'zod';

import type { TsCodeFragment } from '#src/renderers/typescript/index.js';

import {
  renderTsCodeFileTemplate,
  TsCodeUtils,
  tsTemplate,
} from '#src/renderers/typescript/index.js';
import {
  getGeneratedTemplateExportName,
  getGeneratedTemplateInterfaceName,
  getGeneratedTemplateProviderName,
  resolvePackagePathSpecifier,
} from '#src/renderers/utils/index.js';

const GENERATED_PATHS_FILE_NAME = 'generated/template-paths.ts';

const GENERATED_PATHS_TEMPLATE = `
import { createProviderType, createGeneratorTask } from '@baseplate-dev/sync';

export interface PATHS_TYPE_NAME {
  PATHS_CONTENTS;
}

export const PATHS_PROVIDER_EXPORT = createProviderType<PATHS_TYPE_NAME>('PATHS_PROVIDER_NAME');

export const PATHS_TASK_NAME = createGeneratorTask(PATHS_GENERATOR_TASK);
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
}

export function getPathsFileExportNames(
  generatorName: string,
): PathsFileExportNames {
  return {
    interfaceName: getGeneratedTemplateInterfaceName(generatorName, 'paths'),
    providerExportName: getGeneratedTemplateExportName(generatorName, 'paths'),
    taskName: getGeneratedTemplateExportName(generatorName, 'paths-task'),
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
    mapValuesOfMap(pathMap, (pathRootRelativePath) =>
      pathRootRelativePath.replace(PATH_ROOT_REGEX, (pathRootName) => {
        const pathRootVariableName = pathRootLookup[pathRootName];
        if (!pathRootVariableName) {
          throw new Error(
            `Path root ${pathRootName} not found in path root lookup`,
          );
        }
        return pathRootVariableName;
      }),
    ),
  );

  const run = tsTemplate`
  function run({ ${pathProviders.map((p) => p.providerVariableName).join(', ')} }) {
    ${pathRootDeclarations}

    return {
      providers: {
        ${providerExportName}: ${pathsContents}
      }
    }

    return paths;
  }
  `;

  return TsCodeUtils.mergeFragmentsAsObject({
    dependencies,
    exports,
    run,
  });
}

export function writePathMapFile(
  generatorName: string,
  pathMap: Map<string, string>,
  context: TemplateExtractorContext,
): void {
  const extractorConfig =
    context.configLookup.getExtractorConfigOrThrow(generatorName);
  const pathMapPath = posixJoin(
    extractorConfig.generatorDirectory,
    GENERATED_PATHS_FILE_NAME,
  );

  const fileExportNames = getPathsFileExportNames(generatorName);
  const { interfaceName, providerExportName, taskName } = fileExportNames;

  const taskFragment = createPathsTask(
    generatorName,
    pathMap,
    context,
    fileExportNames,
  );

  const pathMapContents = renderTsCodeFileTemplate({
    templateContents: GENERATED_PATHS_TEMPLATE,
    variables: {
      PATHS_TYPE_NAME: interfaceName,
      PATHS_CONTENTS: [...pathMap]
        .map(([templateName]) => `'${templateName}': string`)
        .join(',\n'),
      PATHS_PROVIDER_EXPORT: providerExportName,
      PATHS_PROVIDER_NAME: getGeneratedTemplateProviderName(
        generatorName,
        'paths',
      ),
      PATHS_GENERATOR_TASK_NAME: taskName,
      PATHS_GENERATOR_TASK: taskFragment,
    },
  });

  context.fileContainer.writeFile(pathMapPath, pathMapContents);
}
