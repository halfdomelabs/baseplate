import type { Command } from 'commander';

import { getDefaultPlugins } from '@baseplate-dev/project-builder-common';
import path from 'node:path';

import { logger } from '#src/services/logger.js';
import { expandPathWithTilde } from '#src/utils/path.js';

interface ListTemplatesOptions {
  json?: boolean;
}

interface DeleteTemplateOptions {
  force?: boolean;
  directory?: string;
}

interface ExtractTemplatesOptions {
  autoGenerateExtractor?: boolean;
  skipClean?: boolean;
}

interface GenerateTemplatesOptions {
  skipClean?: boolean;
}

/**
 * Adds template management commands to the program.
 * @param program - The program to add the commands to.
 */
export function addTemplatesCommand(program: Command): void {
  const templatesCommand = program
    .command('templates')
    .description('Manage generator templates');

  // Templates list subcommand
  templatesCommand
    .command('list [directory]')
    .description('Lists all available generators with their templates')
    .option('--json', 'Output in JSON format', false)
    .action(
      async (directory: string | undefined, options: ListTemplatesOptions) => {
        await handleListTemplates(directory, options);
      },
    );

  // Templates delete subcommand
  templatesCommand
    .command('delete <generator-name> <template-name>')
    .description('Delete a specific template from a generator')
    .option('--force', 'Skip confirmation prompt', false)
    .option('--directory <directory>', 'Directory to search for generators')
    .action(
      async (
        generatorName: string,
        templateName: string,
        options: DeleteTemplateOptions,
      ) => {
        await handleDeleteTemplate(generatorName, templateName, options);
      },
    );

  // Templates extract subcommand
  templatesCommand
    .command('extract <directory> <app>')
    .description(
      'Extracts templates from the specified directory and saves them to the templates directory',
    )
    .option(
      '--auto-generate-extractor',
      'Auto-generate extractor.json files',
      true,
    )
    .option(
      '--skip-clean',
      'Skip cleaning the output directories (templates and generated)',
      false,
    )
    .action(
      async (
        directory: string,
        app: string,
        options: ExtractTemplatesOptions,
      ) => {
        await handleExtractTemplates(directory, app, options);
      },
    );

  // Templates generate subcommand
  templatesCommand
    .command('generate [directory]')
    .description(
      'Generate typed template files from existing extractor.json configurations',
    )
    .option(
      '--skip-clean',
      'Skip cleaning the output directories (templates and generated)',
      false,
    )
    .action(
      async (
        directory: string | undefined,
        options: GenerateTemplatesOptions,
      ) => {
        await handleGenerateTemplates(directory, options);
      },
    );
}

async function handleListTemplates(
  directory: string | undefined,
  options: ListTemplatesOptions,
): Promise<void> {
  const { discoverGenerators } = await import(
    '@baseplate-dev/project-builder-server/template-extractor'
  );

  const resolvedDirectory = directory
    ? expandPathWithTilde(directory)
    : path.resolve('.');
  const defaultPlugins = await getDefaultPlugins(logger);

  try {
    const generators = await discoverGenerators(
      resolvedDirectory,
      defaultPlugins,
      logger,
    );

    // Use existing basic listing logic
    if (options.json) {
      console.info(
        JSON.stringify(
          generators.map((g) => ({
            ...g,
            templates: Object.fromEntries(
              Object.entries(g.templates).map(([templatePath, template]) => [
                templatePath,
                {
                  name: template.name,
                  type: template.type,
                },
              ]),
            ),
          })),
          null,
          2,
        ),
      );
    } else {
      if (generators.length === 0) {
        console.info('No generators found with extractor.json files.');
        return;
      }

      console.info(`Found ${generators.length} generator(s):\n`);

      for (const generator of generators) {
        console.info(`📦 ${generator.name}`);
        console.info(`   Package: ${generator.packageName}`);
        console.info(`   Path: ${generator.generatorDirectory}`);
        console.info(
          `   Templates: ${Object.values(generator.templates)
            .map((t) => t.name)
            .join(', ')}`,
        );
        console.info();
      }
    }
  } catch (error) {
    logger.error(
      `Failed to discover generators: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}

async function handleDeleteTemplate(
  generatorName: string,
  templateName: string,
  options: DeleteTemplateOptions,
): Promise<void> {
  const { deleteTemplate } = await import(
    '@baseplate-dev/project-builder-server/template-extractor'
  );
  const resolvedDirectory = options.directory
    ? expandPathWithTilde(options.directory)
    : path.resolve('.');

  const defaultPlugins = await getDefaultPlugins(logger);

  try {
    await deleteTemplate(generatorName, templateName, {
      defaultPlugins,
      logger,
      directory: resolvedDirectory,
    });

    console.info(
      `✅ Successfully deleted template '${templateName}' from generator '${generatorName}'`,
    );
  } catch (error) {
    logger.error(
      `Failed to delete template: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}

async function handleExtractTemplates(
  directory: string,
  app: string,
  options: ExtractTemplatesOptions,
): Promise<void> {
  const { runTemplateExtractorsForProject } = await import(
    '@baseplate-dev/project-builder-server/template-extractor'
  );

  const resolvedDirectory = expandPathWithTilde(directory);
  const defaultPlugins = await getDefaultPlugins(logger);

  await runTemplateExtractorsForProject(
    resolvedDirectory,
    app,
    defaultPlugins,
    logger,
    {
      autoGenerateExtractor: options.autoGenerateExtractor,
      skipClean: options.skipClean,
    },
  );
}

async function handleGenerateTemplates(
  directory: string | undefined,
  options: GenerateTemplatesOptions,
): Promise<void> {
  const { generateTypedTemplateFiles } = await import(
    '@baseplate-dev/project-builder-server/template-extractor'
  );

  const resolvedDirectory = directory
    ? expandPathWithTilde(directory)
    : undefined;
  const defaultPlugins = await getDefaultPlugins(logger);

  await generateTypedTemplateFiles(resolvedDirectory, defaultPlugins, logger, {
    skipClean: options.skipClean,
  });
}
