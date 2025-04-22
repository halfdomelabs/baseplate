import { pick } from 'es-toolkit';
import { execa, parseCommandString } from 'execa';

interface ExecOptions {
  cwd?: string;
  timeout?: number;
  env?: Record<string, string>;
}

const PASSTHROUGH_ENV_VARS = [
  // Essential for package management
  'HOME',
  'PATH',
  'NODE_OPTIONS',
  'COREPACK_HOME',
  'TMP',
  'TEMP',
  'APPDATA',

  // System libraries for native modules
  'LD_LIBRARY_PATH',
  'DYLD_FALLBACK_LIBRARY_PATH',
  'LIBPATH',

  // Windows-specific paths
  'SYSTEMROOT',
  'SYSTEMDRIVE',

  // User context
  'USER',

  // Localization
  'TZ',
  'LANG',
];

interface ExecuteCommandResult {
  failed: boolean;
  exitCode?: number;
  output: string;
}

export async function executeCommand(
  command: string,
  options: ExecOptions,
): Promise<ExecuteCommandResult> {
  const [file, ...commandArguments] = parseCommandString(command);
  const result = await execa(file, commandArguments, {
    all: true,
    cwd: options.cwd,
    env: {
      ...pick(process.env, PASSTHROUGH_ENV_VARS),
      ...options.env,
    },
    extendEnv: false,
    timeout: options.timeout,
    reject: false,
  });

  return {
    failed: result.failed,
    exitCode: result.exitCode,
    output: result.all,
  };
}
