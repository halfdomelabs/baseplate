import { program } from 'commander';
import { buildProjectForDirectory, buildToCleanFolder } from './runner';

async function runMain(): Promise<void> {
  program.version('0.0.1');
  program
    .command('generate <directory>')
    .description('Builds project from project.json in baseplate/ directory')
    .option('--regen', 'Force regeneration of all files')
    .action(buildProjectForDirectory);

  program
    .command('buildClean <directory>')
    .description(
      'Writes a clean project from project.json in baseplate/ directory to sub-apps'
    )
    .action(buildToCleanFolder);

  await program.parseAsync(process.argv);
}

runMain().catch((err) => console.error(err));
