import { execa, parseCommandString } from 'execa';

export interface ExecOptions {
  cwd?: string;
  timeout?: number;
}

export async function executeCommand(
  command: string,
  options: ExecOptions,
): Promise<string> {
  const [file, ...commandArguments] = parseCommandString(command);
  const result = await execa(file, commandArguments, {
    cwd: options.cwd,
    // strip out npm_* env vars
    env: Object.keys(process.env)
      .filter((k) => !k.startsWith('npm_'))
      .reduce(
        (acc, key) => ({ ...acc, [key]: process.env[key] }),
        {} as Record<string, string | undefined>,
      ),
    extendEnv: false,
    timeout: options.timeout,
  });

  return result.all ?? '';
}
