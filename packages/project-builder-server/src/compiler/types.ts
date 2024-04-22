import { FileEntry } from '@halfdomelabs/project-builder-lib';

export interface CompilerOutput {
  config: unknown;
  files: FileEntry[];
}
