import type { TemplateExtractorContext } from '@baseplate-dev/sync';

import { TEMPLATE_EXTRACTOR_GENERATED_DIRECTORY } from '@baseplate-dev/sync';
import { posixJoin } from '@baseplate-dev/utils/node';
import { isEqual } from 'es-toolkit';

import type { TsCodeFragment } from '#src/renderers/typescript/index.js';

import {
  getGeneratedTemplateConstantName,
  getGeneratedTemplateExportName,
  getGeneratedTemplateInterfaceName,
  getGeneratedTemplateProviderName,
} from '#src/renderers/extractor/utils/index.js';
import { tsImportBuilder } from '#src/renderers/typescript/imports/index.js';
import { tsCodeFragment } from '#src/renderers/typescript/index.js';
import { renderTsCodeFileTemplate } from '#src/renderers/typescript/renderers/index.js';
import {
  TsCodeUtils,
  tsTemplate,
} from '#src/renderers/typescript/utils/index.js';

import type {
  TemplateRendererEntry,
  TemplateRendererTaskDependency,
} from './types.js';

export const GENERATED_RENDERERS_FILE_NAME = 'template-renderers.ts';

const GENERATED_RENDERERS_FILE_PATH = posixJoin(
  TEMPLATE_EXTRACTOR_GENERATED_DIRECTORY,
  GENERATED_RENDERERS_FILE_NAME,
);

const GENERATED_RENDERERS_TEMPLATE = `
import { createProviderType } from '@baseplate-dev/sync';

export interface TPL_PROVIDER_TYPE_NAME {
  TPL_PROVIDER_TYPE_CONTENTS;
}

const TPL_PROVIDER_EXPORT_NAME = createProviderType<TPL_PROVIDER_TYPE_NAME>('TPL_PROVIDER_NAME');

const TPL_TASK_EXPORT_NAME = TPL_TASK_DECLARATION;

export const TPL_EXPORT_NAME = {
  provider: TPL_PROVIDER_EXPORT_NAME,
  task: TPL_TASK_EXPORT_NAME,
};
`;

interface RenderersFileExportNames {
  interfaceName: string;
  providerExportName: string;
  taskExportName: string;
  rootExportName: string;
}

function getRenderersFileExportNames(
  generatorName: string,
): RenderersFileExportNames {
  return {
    interfaceName: getGeneratedTemplateInterfaceName(
      generatorName,
      'renderers',
    ),
    providerExportName: getGeneratedTemplateExportName(
      generatorName,
      'renderers',
    ),
    taskExportName: getGeneratedTemplateExportName(
      generatorName,
      'renderers-task',
    ),
    rootExportName: getGeneratedTemplateConstantName(
      generatorName,
      'renderers',
    ),
  };
}

function createRenderersTask(
  generatorName: string,
  renderers: TemplateRendererEntry[],
  context: TemplateExtractorContext,
  { providerExportName }: RenderersFileExportNames,
): TsCodeFragment {
  // Collect all unique task dependencies from renderer definitions
  const allDependencies = new Map<string, TemplateRendererTaskDependency>();

  for (const renderer of renderers) {
    for (const dep of renderer.taskDependencies) {
      // Check if the dependency already exists
      const existingDep = allDependencies.get(dep.name);
      if (existingDep) {
        if (!isEqual(existingDep, dep)) {
          throw new Error(
            `Duplicate dependency name ${dep.name} with different providers: ` +
              `${existingDep.providerExpression ?? existingDep.providerImportName} (${existingDep.providerImportSpecifier}) ` +
              `and ${dep.providerExpression ?? dep.providerImportName} (${dep.providerImportSpecifier})`,
          );
        }

        continue;
      }

      // Add the dependency
      allDependencies.set(dep.name, dep);
    }
  }

  // Create dependencies object from collected dependencies
  const dependencies = TsCodeUtils.mergeFragmentsAsObject({
    ...Object.fromEntries(
      [...allDependencies].map(([name, dep]) => [
        name,
        tsCodeFragment(dep.providerExpression ?? dep.providerImportName, [
          tsImportBuilder([dep.providerImportName]).from(
            dep.providerImportSpecifier,
          ),
        ]),
      ]),
    ),
  });

  const taskExportKey = providerExportName.replace(/Provider$/, '');

  // Create exports object
  const exports = TsCodeUtils.mergeFragmentsAsObject({
    [taskExportKey]: `${providerExportName}.export()`,
  });

  // Create renderer functions from definitions
  const rendererFunctions = TsCodeUtils.mergeFragmentsAsObject(
    Object.fromEntries(
      renderers.map((renderer) => [
        renderer.name,
        tsTemplate`{ render: ${renderer.renderFunction} }`,
      ]),
    ),
  );

  // Generate run function with dynamic dependency names
  const dependencyNames = [...allDependencies.keys()].toSorted();

  const run = tsTemplate`
  function run({ ${dependencyNames.join(', ')} }) {
    return {
      providers: {
        ${providerExportName}: ${rendererFunctions}
      }
    }
  }
  `;

  const taskOptions = TsCodeUtils.mergeFragmentsAsObject({
    dependencies,
    exports,
    run,
  });

  return TsCodeUtils.templateWithImports([
    tsImportBuilder(['createGeneratorTask']).from('@baseplate-dev/sync'),
  ])`createGeneratorTask(${taskOptions});`;
}

export async function writeRenderersFile(
  generatorName: string,
  renderers: TemplateRendererEntry[],
  context: TemplateExtractorContext,
): Promise<{ exportName: string }> {
  const extractorConfig =
    context.configLookup.getExtractorConfigOrThrow(generatorName);
  const renderersFilePath = posixJoin(
    extractorConfig.generatorDirectory,
    GENERATED_RENDERERS_FILE_PATH,
  );

  const fileExportNames = getRenderersFileExportNames(generatorName);
  const { interfaceName, providerExportName, taskExportName } = fileExportNames;

  const taskFragment = createRenderersTask(
    generatorName,
    renderers,
    context,
    fileExportNames,
  );

  const renderersFileContents = renderTsCodeFileTemplate({
    templateContents: GENERATED_RENDERERS_TEMPLATE,
    variables: {
      TPL_PROVIDER_TYPE_NAME: interfaceName,
      TPL_PROVIDER_TYPE_CONTENTS: TsCodeUtils.mergeFragmentsAsInterfaceContent(
        new Map(
          renderers.map((renderer) => [
            renderer.name,
            tsTemplate`{ render: ${renderer.renderType} }`,
          ]),
        ),
      ),
      TPL_PROVIDER_EXPORT_NAME: providerExportName,
      TPL_PROVIDER_NAME: getGeneratedTemplateProviderName(
        generatorName,
        'renderers',
      ),
      TPL_TASK_DECLARATION: taskFragment,
      TPL_TASK_EXPORT_NAME: taskExportName,
      TPL_EXPORT_NAME: fileExportNames.rootExportName,
    },
    options: {
      importSortOptions: {
        internalPatterns: [/^#src/],
      },
    },
  });

  await context.fileContainer.writeFile(
    renderersFilePath,
    renderersFileContents,
  );

  return {
    exportName: fileExportNames.rootExportName,
  };
}
