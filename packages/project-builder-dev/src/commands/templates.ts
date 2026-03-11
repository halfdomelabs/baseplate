import type { Command } from 'commander';

import {
  createGeneratorAction,
  deleteTemplateByNameAction,
  extractTemplatesAction,
  generateTemplatesAction,
  invokeServiceActionAsCli,
  listTemplatesAction,
} from '@baseplate-dev/project-builder-server/actions';
import { expandPathWithTilde } from '@baseplate-dev/utils/node';

import { createServiceActionContext } from '#src/utils/create-service-action-context.js';

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

interface CreateGeneratorOptions {
  includeTemplates?: boolean;
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
    .command('list <generator-directory>')
    .description('Lists all templates in a specific generator directory')
    .action(async (generatorDirectory: string) => {
      await handleListTemplates(generatorDirectory);
    });

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
    .command('extract <project> <app>')
    .description(
      'Extracts templates from the specified project (name or directory) and saves them to the templates directory',
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
        project: string,
        app: string,
        options: ExtractTemplatesOptions,
      ) => {
        await handleExtractTemplates(project, app, options);
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

  // Templates create subcommand
  templatesCommand
    .command('create <name> <directory>')
    .description(
      'Create a new generator with boilerplate code (e.g., "baseplate-dev templates create email/sendgrid packages/fastify-generators/src/generators")',
    )
    .option(
      '--no-include-templates',
      'Skip creating placeholder template setup (generated/, extractor.json)',
    )
    .action(
      async (
        name: string,
        directory: string,
        options: CreateGeneratorOptions,
      ) => {
        await handleCreateGenerator(name, directory, options);
      },
    );
}

async function handleListTemplates(generatorDirectory: string): Promise<void> {
  const resolvedDirectory = expandPathWithTilde(generatorDirectory);
  const context = await createServiceActionContext();

  await invokeServiceActionAsCli(
    listTemplatesAction,
    { generatorDirectory: resolvedDirectory },
    context,
  );
}

async function handleDeleteTemplate(
  generatorName: string,
  templateName: string,
  options: DeleteTemplateOptions,
): Promise<void> {
  const resolvedDirectory = options.directory
    ? expandPathWithTilde(options.directory)
    : undefined;

  const context = await createServiceActionContext();

  await invokeServiceActionAsCli(
    deleteTemplateByNameAction,
    {
      generatorName,
      templateName,
      directory: resolvedDirectory,
    },
    context,
  );
}

async function handleExtractTemplates(
  project: string,
  app: string,
  options: ExtractTemplatesOptions,
): Promise<void> {
  const context = await createServiceActionContext();

  await invokeServiceActionAsCli(
    extractTemplatesAction,
    {
      project,
      app,
      autoGenerateExtractor: options.autoGenerateExtractor,
      skipClean: options.skipClean,
    },
    context,
  );
}

async function handleGenerateTemplates(
  directory: string | undefined,
  options: GenerateTemplatesOptions,
): Promise<void> {
  const context = await createServiceActionContext();

  await invokeServiceActionAsCli(
    generateTemplatesAction,
    {
      project: directory ? expandPathWithTilde(directory) : undefined,
      skipClean: options.skipClean,
    },
    context,
  );
}

async function handleCreateGenerator(
  name: string,
  directory: string,
  options: CreateGeneratorOptions,
): Promise<void> {
  const resolvedDirectory = expandPathWithTilde(directory);
  const context = await createServiceActionContext();

  await invokeServiceActionAsCli(
    createGeneratorAction,
    {
      name,
      directory: resolvedDirectory,
      includeTemplates: options.includeTemplates ?? true,
    },
    context,
  );
}
