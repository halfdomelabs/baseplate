import { execa, parseCommandString } from 'execa';

interface ExecOptions {
  cwd?: string;
  timeout?: number;
}

export async function executeCommand(
  command: string,
  options: ExecOptions,
): Promise<string> {
  const [file, ...commandArguments] = parseCommandString(command);
  const result = await execa(file, commandArguments, {
    all: true,
    cwd: options.cwd,
    // strip out npm_* env vars
    env: Object.fromEntries(
      Object.keys(process.env)
        .filter((k) => !k.startsWith('npm_'))
        .map((key) => [key, process.env[key]]),
    ),
    extendEnv: false,
    timeout: options.timeout,
  });

  return result.all;
}
