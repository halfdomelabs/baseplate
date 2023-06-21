import { execaCommand } from 'execa';

export class ExecError extends Error {
  constructor(message: string, public readonly stderr: string) {
    super(message);
  }
}

export interface ExecOptions {
  cwd?: string;
}

export async function executeCommand(
  command: string,
  options: ExecOptions
): Promise<string> {
  const result = await execaCommand(command, {
    cwd: options.cwd,
    stdio: 'inherit',
  });

  return result.all || '';
}
