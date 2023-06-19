import { exec, ExecOptions } from 'child_process';

export class ExecError extends Error {
  constructor(message: string, public readonly stderr: string) {
    super(message);
  }
}

export async function executeCommand(
  command: string,
  options: ExecOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      if (stderr) {
        reject(new ExecError('Received stderr', stderr));
        return;
      }
      resolve(stdout.trim());
    });
  });
}
