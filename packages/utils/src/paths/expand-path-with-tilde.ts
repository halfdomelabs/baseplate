import os from 'node:os';
import path from 'node:path';

export function expandPathWithTilde(directoryPath: string): string {
  if (directoryPath.startsWith('~')) {
    return path.resolve(directoryPath.replace('~', os.homedir()));
  }
  return path.resolve(directoryPath);
}
