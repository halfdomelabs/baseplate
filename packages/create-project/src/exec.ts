import { execa } from 'execa';
import ora from 'ora';

export async function exec(command: string, cwd?: string): Promise<void> {
  const spinner = ora({
    text: `Running ${command}...`,
  }).start();

  try {
    const [cmd, ...args] = command.split(' ');
    await execa(cmd, args, { cwd });
    spinner.succeed();
  } catch (error) {
    spinner.fail();
    throw error;
  }
}
