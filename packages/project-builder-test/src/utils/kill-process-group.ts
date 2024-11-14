/**
 * Adapted from https://github.com/Kikobeats/kill-process-group/blob/f32f97491f255a7b763a578c46b49da78b1485a6/src/index.js#L8-L33
 *
 * © Kiko Beats, released under the MIT License.
 */

import type { Subprocess } from 'execa';

import { execa } from 'execa';

import { logger } from './console.js';

const isWin = process.platform === 'win32';

/**
 * Kills a process group.
 *
 * @param subprocess - The subprocess to kill.
 * @param options - Optional parameters.
 * @param options.signal - The signal to send to the process group. Default is 'SIGTERM'.
 * @returns A promise that resolves when the process group is killed.
 */
export async function killProcessGroup(
  subprocess: Subprocess,
  { signal = 'SIGTERM' }: { signal?: NodeJS.Signals } = {},
): Promise<void> {
  if (!subprocess.pid) {
    return;
  }
  try {
    if (isWin) {
      await execa`taskkill /pid ${subprocess.pid} /T /F`;
    } else {
      // on linux the process group can be killed with the group id prefixed with
      // a minus sign. The process group id is the group leader's pid.
      const processGroupId = -subprocess.pid;
      process.kill(processGroupId, signal);
    }
  } catch {
    // taskkill can fail to kill the process e.g. due to missing permissions.
    // Let's kill the process via Node API. This delays killing of all child
    // processes of `this.proc` until the main Node.js process dies.
    subprocess.kill(signal);
  }
}

/**
 * Safely kills a process group.
 *
 * @param subprocess - The subprocess to kill.
 * @param timeout - The timeout in milliseconds before forcefully killing the process group. Default is 5000ms.
 * @returns A promise that resolves when the first attempt to kill the process goes through.
 */
export async function safeKillProcessGroup(
  subprocess: Subprocess,
  timeout = 5000,
): Promise<void> {
  if (!subprocess.pid) {
    return;
  }

  const timeoutRef = setTimeout(() => {
    if (subprocess.killed) return;
    killProcessGroup(subprocess, { signal: 'SIGKILL' }).catch(
      (err: unknown) => {
        logger.error(`Unable to kill process group`, err);
      },
    );
  }, timeout);

  subprocess.on('exit', () => {
    clearTimeout(timeoutRef);
  });

  return killProcessGroup(subprocess);
}
