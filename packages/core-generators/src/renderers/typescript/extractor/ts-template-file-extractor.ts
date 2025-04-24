import type {
  TemplateFileExtractorContext,
  TemplateFileExtractorFile,
} from '@halfdomelabs/sync';

import {
  getGenerationConcurrencyLimit,
  parseGeneratorName,
  TemplateFileExtractor,
} from '@halfdomelabs/sync';
import { mapGroupBy, mapKeyBy, quot } from '@halfdomelabs/utils';
import {
  getCommonPathPrefix,
  handleFileNotFoundError,
  readJsonWithSchema,
} from '@halfdomelabs/utils/node';
import { camelCase, constantCase, sortBy, uniq } from 'es-toolkit';
import path from 'node:path';
import { ResolverFactory } from 'oxc-resolver';
import pLimit from 'p-limit';
import { z } from 'zod';

import type { TsCodeFragment } from '../fragments/types.js';
import type { TsTemplateFileMetadata } from '../templates/types.js';
import type {
  ProjectExportLookupMap,
  TsTemplateImportLookupContext,
} from './organize-ts-template-imports.js';
import type { TsProjectExport } from './write-ts-project-exports.js';

import { tsCodeFragment } from '../fragments/creators.js';
import { tsImportBuilder } from '../imports/builder.js';
import { renderTsCodeFileTemplate } from '../renderers/file.js';
import {
  TS_TEMPLATE_TYPE,
  tsTemplateFileMetadataSchema,
} from '../templates/types.js';
import { TsCodeUtils } from '../ts-code-utils.js';
import { organizeTsTemplateImports } from './organize-ts-template-imports.js';
import { stripTsTemplateVariables } from './strip-ts-template-variables.js';
import { writeTsProjectExports } from './write-ts-project-exports.js';

interface TypescriptCodeEntry {
  codeBlock: TsCodeFragment;
  exportName: string;
}

function getImportSourceForGenerator(
  generatorName: string,
  importPath: string,
  importPackage: string,
): string {
  const { packageName } = parseGeneratorName(generatorName);
  return importPackage === packageName ? importPath : importPackage;
}

const GENERATOR_OPTIONS_FILENAME = 'ts-extractor.json';
const generatorOptionsSchema = z.object({
  exportConfiguration: z
    .object({
      existingImportsProvider: z
        .object({
          /**
           * The module specifier of the existing imports provider.
           *
           * Can be a relative path with @/ or a package name.
           */
          moduleSpecifier: z.string(),
          /**
           * The name of the import schema export.
           */
          importSchemaName: z.string(),
          /**
           * The name of the provider type export.
           */
          providerTypeName: z.string(),
          /**
           * The name of the provider export.
           */
          providerName: z.string(),
        })
        .optional(),
    })
    .optional(),
});

type GeneratorOptions = z.infer<typeof generatorOptionsSchema>;

export class TsTemplateFileExtractor extends TemplateFileExtractor<
  typeof tsTemplateFileMetadataSchema
> {
  public name = TS_TEMPLATE_TYPE;
  public metadataSchema = tsTemplateFileMetadataSchema;

  protected pathResolver: ResolverFactory;

  constructor(
    context: TemplateFileExtractorContext,
    {
      pathResolver,
    }: {
      pathResolver?: ResolverFactory;
    } = {},
  ) {
    super(context);
    this.pathResolver =
      pathResolver ??
      new ResolverFactory({
        tsconfig: {
          configFile: path.join(
            this.getProjectBaseDirectory(),
            'tsconfig.json',
          ),
        },
        conditionNames: ['node', 'require'],
        extensions: ['.ts', '.tsx', '.d.ts', '.js', '.jsx', '.json', '.node'],
        extensionAlias: {
          '.js': ['.ts', '.tsx', '.d.ts', '.js'],
          '.jsx': ['.tsx', '.d.ts', '.jsx'],
          '.cjs': ['.cts', '.d.cts', '.cjs'],
          '.mjs': ['.mts', '.d.mts', '.mjs'],
        },
      });
  }

  private generatorConfigCacheMap = new Map<string, GeneratorOptions>();

  protected async getGeneratorOptions(
    generatorName: string,
  ): Promise<GeneratorOptions> {
    let generatorOptions = this.generatorConfigCacheMap.get(generatorName);
    if (!generatorOptions) {
      const generatorBase = this.getGeneratorBaseDirectory(generatorName);
      const generatorOptionsPath = path.join(
        generatorBase,
        GENERATOR_OPTIONS_FILENAME,
      );
      generatorOptions =
        (await readJsonWithSchema(
          generatorOptionsPath,
          generatorOptionsSchema,
        ).catch(handleFileNotFoundError)) ?? {};
      this.generatorConfigCacheMap.set(generatorName, generatorOptions);
    }
    return generatorOptions;
  }

  protected getTypescriptRendererImport(generatorName: string): string {
    return generatorName.startsWith('@halfdomelabs/core-generators#')
      ? '@src/renderers/typescript/index.js'
      : '@halfdomelabs/core-generators';
  }

  protected async extractTemplateFile(
    file: TemplateFileExtractorFile<TsTemplateFileMetadata>,
    importLookupContext: TsTemplateImportLookupContext,
  ): Promise<
    TypescriptCodeEntry & {
      originalPath: string;
    }
  > {
    const sourceFileContents = await this.readSourceFile(file.path);
    const strippedContent = stripTsTemplateVariables(
      file.metadata,
      sourceFileContents,
    );

    const { usedProjectExports, contents: organizedContents } =
      await organizeTsTemplateImports(
        file.path,
        strippedContent,
        importLookupContext,
      );

    const usedImportProviderMap = mapKeyBy(
      usedProjectExports,
      (projectExport) => projectExport.providerImportName,
    );
    const generatorName = file.metadata.generator;
    const usedImportProviders = [...usedImportProviderMap.values()].map(
      (projectExport) => ({
        name: projectExport.importSource.slice(1),
        providerFragment: tsCodeFragment(
          projectExport.providerImportName,
          tsImportBuilder([projectExport.providerImportName]).from(
            getImportSourceForGenerator(
              generatorName,
              path.relative(
                path.join(
                  this.getGeneratorBaseDirectory(generatorName),
                  'generated',
                ),
                projectExport.providerPath.replace(/\.ts$/, '.js'),
              ),
              projectExport.providerPackage,
            ),
          ),
        ),
      }),
    );

    const processedContent = `// @ts-nocheck\n\n${organizedContents}`;

    await this.writeTemplateFileIfModified(file, processedContent);

    const templateName = camelCase(file.metadata.name);

    const templateOptions = TsCodeUtils.mergeFragmentsAsObject({
      name: quot(file.metadata.name),
      group: file.metadata.group ? quot(file.metadata.group) : undefined,
      source: JSON.stringify({
        path: file.metadata.template,
      }),
      variables: JSON.stringify(file.metadata.variables ?? {}),
      projectExports: JSON.stringify(file.metadata.projectExports ?? {}),
      importMapProviders:
        usedImportProviders.length > 0
          ? TsCodeUtils.mergeFragmentsAsObject(
              Object.fromEntries(
                usedImportProviders.map((importProvider) => [
                  importProvider.name,
                  importProvider.providerFragment,
                ]),
              ),
            )
          : undefined,
    });

    return {
      codeBlock: TsCodeUtils.templateWithImports([
        tsImportBuilder(['createTsTemplateFile']).from(
          this.getTypescriptRendererImport(generatorName),
        ),
      ])`const ${templateName} = createTsTemplateFile(${templateOptions});`,
      exportName: templateName,
      originalPath: file.path,
    };
  }

  protected async extractTemplateFilesForGroup(
    generatorName: string,
    groupName: string,
    files: TemplateFileExtractorFile<TsTemplateFileMetadata>[],
    lookupContext: TsTemplateImportLookupContext,
  ): Promise<TypescriptCodeEntry> {
    const results = await Promise.all(
      files.map((file) => this.extractTemplateFile(file, lookupContext)),
    );

    const originalPaths = results.map((result) => result.originalPath);
    // identify greatest common prefix
    const commonPathPrefix = getCommonPathPrefix(originalPaths);

    const groupNameVariable = `${camelCase(groupName)}Group`;

    const groupBlock = TsCodeUtils.templateWithImports(
      tsImportBuilder(['createTsTemplateGroup']).from(
        this.getTypescriptRendererImport(generatorName),
      ),
    )`const ${groupNameVariable} = createTsTemplateGroup({
      templates: ${TsCodeUtils.mergeFragmentsAsObject(
        Object.fromEntries(
          results.map((result) => [
            result.exportName,
            TsCodeUtils.mergeFragmentsAsObject({
              destination: quot(
                path.relative(commonPathPrefix, result.originalPath),
              ),
              template: result.exportName,
            }),
          ]),
        ),
      )}
    });`;

    return {
      codeBlock: TsCodeUtils.mergeFragmentsPresorted(
        [
          ...sortBy(results, [(r) => r.exportName]).map(
            (result) => result.codeBlock,
          ),
          groupBlock,
        ],
        '\n\n',
      ),
      exportName: groupNameVariable,
    };
  }

  protected async extractTemplateFilesForGenerator(
    generatorName: string,
    files: TemplateFileExtractorFile<TsTemplateFileMetadata>[],
    projectExportMap: ProjectExportLookupMap,
  ): Promise<void> {
    const extractLimit = pLimit(getGenerationConcurrencyLimit());

    const filesByGroups = mapGroupBy(
      files.filter((file) => file.metadata.group),
      (file) => file.metadata.group ?? '',
    );
    const filesWithoutGroups = files.filter((file) => !file.metadata.group);

    const lookupContext: TsTemplateImportLookupContext = {
      projectExportMap,
      projectRoot: this.getProjectBaseDirectory(),
      generatorFiles: files.map((file) => file.path),
      resolver: this.pathResolver,
    };

    const results = await Promise.all([
      ...[...filesByGroups].map(([groupName, files]) =>
        extractLimit(() =>
          this.extractTemplateFilesForGroup(
            generatorName,
            groupName,
            files,
            lookupContext,
          ),
        ),
      ),
      ...filesWithoutGroups.map((file) =>
        extractLimit(() => this.extractTemplateFile(file, lookupContext)),
      ),
    ]);

    if (!generatorName.includes('#')) {
      throw new Error(
        `Generator name ${generatorName} is not in the correct format. Please use the format <package-name>#<generator-name>.`,
      );
    }
    const templatesVariableName = `${constantCase(generatorName.split('#')[1])}_TS_TEMPLATES`;

    const templatesFile = renderTsCodeFileTemplate(
      `TPL_CODE_BLOCKS
      
      export const TPL_TEMPLATE_VARIABLE_NAME = TPL_RESULT;`,
      {
        TPL_CODE_BLOCKS: TsCodeUtils.mergeFragmentsPresorted(
          sortBy(results, [(r) => r.exportName]).map(
            (result) => result.codeBlock,
          ),
          '\n\n',
        ),
        TPL_TEMPLATE_VARIABLE_NAME: templatesVariableName,
        TPL_RESULT: TsCodeUtils.mergeFragmentsAsObject(
          Object.fromEntries(
            results.map((result) => [result.exportName, result.exportName]),
          ),
        ),
      },
    );

    await this.writeGeneratedTypescriptFileIfModified(
      generatorName,
      'ts-templates.ts',
      templatesFile,
    );
  }

  /**
   * Generates an import file for a generator.
   *
   * @param generatorName - The name of the generator.
   * @param files - The files to generate the import file for.
   * @returns A list of project exports.
   */
  protected async generateImportFileForGenerator(
    generatorName: string,
    files: TemplateFileExtractorFile<TsTemplateFileMetadata>[],
  ): Promise<TsProjectExport[]> {
    const importMapsPath = path.join(
      this.getGeneratorBaseDirectory(generatorName),
      'generated/ts-import-maps.ts',
    );
    const generatorOptions = await this.getGeneratorOptions(generatorName);
    const packagePath = this.getGeneratorPackagePath(generatorName);
    const { importsFileFragment, projectExports } = writeTsProjectExports(
      files,
      generatorName,
      {
        importMapFilePath: importMapsPath,
        packagePath,
        existingImportsProvider:
          generatorOptions.exportConfiguration?.existingImportsProvider,
      },
    );

    const importsFileContents = importsFileFragment
      ? renderTsCodeFileTemplate(
          `TPL_CONTENTS`,
          {
            TPL_CONTENTS: importsFileFragment,
          },
          {},
          {
            importSortOptions: {
              internalPatterns: [/^@src\//],
            },
          },
        )
      : undefined;

    await (importsFileContents
      ? this.writeGeneratedTypescriptFileIfModified(
          generatorName,
          'ts-import-maps.ts',
          importsFileContents,
        )
      : this.deleteGeneratedTypescriptFile(generatorName, 'ts-import-maps.ts'));

    return projectExports;
  }

  async extractTemplateFiles(
    files: TemplateFileExtractorFile<TsTemplateFileMetadata>[],
  ): Promise<void> {
    const filesByGenerator = mapGroupBy(
      files,
      (file) => file.metadata.generator,
    );
    const projectExports: TsProjectExport[] = [];
    for (const [generator, filesInGenerator] of filesByGenerator) {
      const result = await this.generateImportFileForGenerator(
        generator,
        filesInGenerator,
      );
      projectExports.push(...result);
    }

    // make sure there are no duplicate importProviderNames with different import paths
    const importProviderNameMap = mapGroupBy(
      projectExports,
      (projectExport) => projectExport.providerImportName,
    );
    for (const [providerImportName, projectExports] of importProviderNameMap) {
      const projectExportPaths = uniq(
        projectExports.map((projectExport) => projectExport.providerPath),
      );
      if (projectExportPaths.length > 1) {
        throw new Error(
          `Duplicate import provider: ${providerImportName} in ${projectExportPaths.join(', ')}`,
        );
      }
    }

    // organize project exports by project relative path
    const projectExportMap = new Map<string, Map<string, TsProjectExport>>();
    for (const projectExport of projectExports) {
      const { filePath } = projectExport;
      const exportName = projectExport.name;
      if (!projectExportMap.has(filePath)) {
        projectExportMap.set(filePath, new Map());
      }
      if (projectExportMap.get(filePath)?.has(exportName)) {
        throw new Error(
          `Duplicate project export: ${exportName} in ${filePath}`,
        );
      }
      projectExportMap.get(filePath)?.set(exportName, projectExport);
    }

    for (const [generator, filesInGenerator] of filesByGenerator) {
      await this.extractTemplateFilesForGenerator(
        generator,
        filesInGenerator,
        projectExportMap,
      );
    }
  }
}
