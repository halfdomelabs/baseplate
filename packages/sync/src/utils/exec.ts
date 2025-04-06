import { execa, parseCommandString } from 'execa';

interface ExecOptions {
  cwd?: string;
  timeout?: number;
  env?: Record<string, string>;
}

export async function executeCommand(
  command: string,
  options: ExecOptions,
): Promise<string> {
  const [file, ...commandArguments] = parseCommandString(command);
  const result = await execa(file, commandArguments, {
    all: true,
    cwd: options.cwd,
    env: {
      // strip out npm_* env vars
      ...Object.fromEntries(
        Object.keys(process.env)
          .filter((k) => !k.startsWith('npm_'))
          .map((key) => [key, process.env[key]]),
      ),
      ...options.env,
    },
    extendEnv: false,
    timeout: options.timeout,
  });

  return result.all;
}
