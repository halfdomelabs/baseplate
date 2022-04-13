import { program } from 'commander';
import { buildAppForDirectory } from './runner';

async function runMain(): Promise<void> {
  program.version('0.0.1');
  program
    .command('generate <directory>')
    .description('Builds project from project.json in baseplate/ directory')
    .option('--regen', 'Force regeneration of all files')
    .action(buildAppForDirectory);

  await program.parseAsync(process.argv);
}

runMain().catch((err) => console.error(err));
