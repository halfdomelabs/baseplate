import { program } from 'commander';
import fs from 'fs/promises';
import { resolve } from 'path';

import { runMorpher } from 'lib/runner.js';
import { TypescriptMorpher } from 'lib/types.js';

interface Options {
  dryRun: boolean;
  options: string[];
}

async function getTransformers(): Promise<TypescriptMorpher[]> {
  const files = await fs.readdir(resolve('./morphers'));
  const transformers = await Promise.all(
    files.map(async (file) => {
      const module = (await import(`../morphers/${file}`)) as {
        default: TypescriptMorpher;
      };
      return module.default;
    }),
  );

  return transformers;
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
    .argument('<transformer>', 'Transformer to run')
    .argument('<path>', 'File or directory to run migration on')
    .action(async (transformer: string, path: string, options: Options) => {
      const transformers = await getTransformers();
      const selectedTransformer = transformers.find(
        (t) => t.name === transformer,
      );

      if (!selectedTransformer) {
        throw new Error(
          `Could not find transformer ${transformer}. Available transformers:
          \n${transformers.map((t) => `+ ${t.name}`).join('\n')}\n`,
        );
      }

      const fullPath = resolve(process.cwd(), path);

      const extractedOptions = options.options.reduce((acc, option) => {
        const [key, ...values] = option.split('=');
        const value = values.join('=');
        return { ...acc, [key]: value };
      }, {});

      return runMorpher(
        fullPath,
        selectedTransformer,
        extractedOptions,
        options,
      );
    });

  await program.parseAsync();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
