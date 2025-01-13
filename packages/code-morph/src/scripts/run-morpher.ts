#!/usr/bin/env node

import { checkbox, input, search } from '@inquirer/prompts';
import { program } from 'commander';
import { globby } from 'globby';
import path from 'node:path';

import type { TypescriptMorpher } from '@src/types.js';
import type { WorkspacePackage } from '@src/utils/find-workspace-projects.js';

import { loadMorphers } from '@src/load-morphers.js';
import { runMorpher } from '@src/runner.js';
import { asyncFilter } from '@src/utils/array.js';
import { getWorkspacePackages } from '@src/utils/find-workspace-projects.js';
import { pathExists } from '@src/utils/fs.js';

interface Options {
  dryRun?: boolean;
  options?: string[];
  morpher?: string;
  packages?: string[];
  displayCommand?: boolean;
}

async function getMorpher(options: Options): Promise<TypescriptMorpher> {
  const morphers = await loadMorphers();

  const selectedMorpherName =
    options.morpher ??
    (await search({
      message: 'Select a morpher',
      source: (term) =>
        morphers
          .filter((morpher) => morpher.name.includes(term ?? ''))
          .map((morpher) => ({
            name: morpher.name,
            value: morpher.name,
            description: morpher.description,
          })),
    }));

  const selectedMorpher = morphers.find((t) => t.name === selectedMorpherName);

  if (!selectedMorpher) {
    throw new Error(`Could not find morpher ${selectedMorpherName}.`);
  }

  return selectedMorpher;
}

async function getPackages(
  options: Options,
  morpher: TypescriptMorpher,
): Promise<WorkspacePackage[]> {
  const workspacePackages = await getWorkspacePackages();

  const preselectedPackages = options.packages;
  if (preselectedPackages?.length) {
    const invalidPackages = preselectedPackages.filter(
      (p) => !workspacePackages.some((p2) => p2.name === p),
    );

    if (invalidPackages.length > 0) {
      throw new Error(
        `Invalid packages: ${invalidPackages.map((p) => p).join(', ')}`,
      );
    }

    return workspacePackages.filter((p) =>
      preselectedPackages.includes(p.name),
    );
  }
  const packagesWithGlobs = await asyncFilter(
    workspacePackages,
    async (pkg) => {
      if (!(await pathExists(path.join(pkg.directory, 'tsconfig.json'))))
        return false;
      if (!morpher.pathGlobs?.length) return true;

      const matchingFiles = await globby(morpher.pathGlobs, {
        cwd: pkg.directory,
        gitignore: true,
      });
      return matchingFiles.length > 0;
    },
  );

  const selectedPackages =
    options.packages ??
    (await checkbox({
      message: 'Select a package',
      choices: packagesWithGlobs.map((pkg) => ({
        name: pkg.name,
        value: pkg.name,
      })),
      loop: false,
      pageSize: 20,
      required: true,
    }));

  return workspacePackages.filter((p) => selectedPackages.includes(p.name));
}

async function getMorpherOptions(
  options: Options,
  morpher: TypescriptMorpher,
): Promise<Record<string, string>> {
  if (options.options?.length) {
    const extractedOptions: Record<string, string> = {};
    for (const option of options.options) {
      const [key, ...values] = option.split('=');
      if (key in morpher.options) {
        const newValue = values.join('=');
        if (morpher.options[key].validation) {
          const result = morpher.options[key].validation.safeParse(newValue);
          if (!result.success) throw new Error(result.error.message);
        }
        extractedOptions[key] = newValue;
      }
    }

    // check for missing options
    const missingOptions = Object.keys(morpher.options).filter(
      (option) => !extractedOptions[option],
    );
    if (missingOptions.length > 0) {
      throw new Error(`Missing options: ${missingOptions.join(', ')}`);
    }

    return extractedOptions;
  }

  // ask for options from user
  const promptedOptions: Record<string, string> = {};
  for (const [optionName, option] of Object.entries(morpher.options)) {
    const prompt = await input({
      message: `Please enter the value for ${optionName}${
        option.optional ? ' (optional)' : ''
      }${option.description ? `: ${option.description}` : ''}`,
      validate: (value) => {
        if (!option.optional && !value) return 'This option is required';
        if (option.validation) {
          const result = option.validation.safeParse(value);
          if (!result.success) return result.error.message;
        }
        return true;
      },
    });
    promptedOptions[optionName] = prompt;
  }

  return promptedOptions;
}

function getMorpherCommand(
  morpher: TypescriptMorpher,
  packages: WorkspacePackage[],
  options: Record<string, string>,
): string {
  return `pnpm run:morpher -m ${morpher.name} -p ${packages.map((p) => p.name).join(' ')} --options ${Object.entries(
    options,
  )
    .map(([key, value]) => `${key}=${value}`)
    .join(' ')}`;
}

/**
 * Custom migration runner using ts-morph
 */
async function main(): Promise<void> {
  program
    .name(process.argv[1])
    .option('-d,--dry-run', 'Dry run the migration')
    .option(
      '-o,--options [options...]',
      'Options for the migration (in format of key=value)',
    )
    .option('-m,--morpher <morpher>', 'Morpher to run')
    .option('-p,--packages <packages...>', 'Packages to run migration on')
    .option('--display-command', 'Display command to run morpher')
    .action(async (options: Options) => {
      const morpher = await getMorpher(options);
      const packages = await getPackages(options, morpher);
      const morpherOptions = await getMorpherOptions(options, morpher);

      if (options.displayCommand) {
        console.info(getMorpherCommand(morpher, packages, morpherOptions));
        return;
      }

      for (const pkg of packages) {
        console.info(`Running ${morpher.name} on ${pkg.name}...`);
        await runMorpher(pkg.directory, morpher, morpherOptions, options);
      }

      console.info(`Completed ${morpher.name} on ${packages.length} packages!`);
    });

  await program.parseAsync();
}

await main().catch((err: unknown) => {
  if (err instanceof Error && err.name === 'ExitPromptError') {
    process.exit(1);
  }
  console.error(err);
  process.exit(1);
});
