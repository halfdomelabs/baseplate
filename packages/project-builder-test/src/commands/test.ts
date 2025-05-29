import type { Command } from 'commander';

import { runTests } from '#src/runner/runner.js';

export function addCliTestCommand(program: Command): void {
  program
    .command('test')
    .argument('[filter]', 'Filter tests by substring')
    .description('Runs the project builder test suite')
    .action(runTests);
}
