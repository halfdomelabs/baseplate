import { program } from 'commander';
import { buildAppForDirectory } from './runner';

async function runMain(): Promise<void> {
  program.version('0.0.1');
  program
    .command('generate <directory>')
    .description('Builds app from app.json in directory')
    .action(buildAppForDirectory);

  await program.parseAsync(process.argv);
}

runMain().catch((err) => console.error(err));
