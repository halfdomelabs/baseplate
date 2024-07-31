import { Command } from 'commander';

import { addCliGenerateCommand } from './generate.js';
import { addCliServeCommand } from './serve.js';
import { addCliTestCommand } from './test.js';

export function addCliCommands(program: Command): void {
  addCliTestCommand(program);
  addCliGenerateCommand(program);
  addCliServeCommand(program);
}
