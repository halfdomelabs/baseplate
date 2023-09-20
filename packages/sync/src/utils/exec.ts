import { execaCommand } from 'execa';

export class ExecError extends Error {
  constructor(
    message: string,
    public readonly stderr: string,
  ) {
    super(message);
  }
}

export interface ExecOptions {
  cwd?: string;
}

export async function executeCommand(
  command: string,
  options: ExecOptions,
): Promise<string> {
  const result = await execaCommand(command, {
    cwd: options.cwd,
    stdio: 'inherit',
    // strip out npm_* env vars
    env: Object.keys(process.env)
      .filter((k) => !k.startsWith('npm_'))
      .reduce(
        (acc, key) => ({ ...acc, [key]: process.env[key] }),
        {} as Record<string, string | undefined>,
      ),
    extendEnv: false,
  });

  return result.all || '';
}
