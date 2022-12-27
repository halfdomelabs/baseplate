import os from 'os';
import path from 'path';

export function expandPathWithTilde(directoryPath: string): string {
  if (directoryPath.startsWith('~')) {
    return path.resolve(directoryPath.replace('~', os.homedir()));
  }
  return path.resolve(directoryPath);
}
