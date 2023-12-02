import { program } from 'commander';
import fs from 'fs/promises';
import { Project, SourceFile } from 'ts-morph';

import { findNearestTsconfig } from './find-nearest-tsconfig.js';

interface SingleFileMigrationOptions {
  dryRun?: boolean;
}

export function runSingleFileMigration(
  migration: (
    file: SourceFile,
    options: { dryRun?: boolean },
  ) => Promise<void> | void,
): void {
  program
    .name(process.argv[1])
    .option('-d,--dry-run')
    .argument('<input-file>', 'File to run migration on');

  program.parse();

  const options = program.opts<SingleFileMigrationOptions>();

  const inputFile = program.args[0];

  async function run(): Promise<void> {
    console.info(`Running migration on ${inputFile}...`);

    if ((await fs.stat(inputFile).catch(() => null)) === null) {
      throw new Error(`File ${inputFile} does not exist`);
    }

    const tsConfig = findNearestTsconfig(inputFile);

    const project = new Project({
      tsConfigFilePath: tsConfig,
      skipAddingFilesFromTsConfig: true,
    });

    const file = project.addSourceFileAtPath(inputFile);

    await migration(file, options);

    if (!options.dryRun) {
      await file.save();
    } else {
      console.log('Raw file:\n');
      console.info(file.getText());
    }
  }

  run()
    .then(() => {
      console.info('Migration complete!');
    })
    .catch((err) => console.error(err));
}
