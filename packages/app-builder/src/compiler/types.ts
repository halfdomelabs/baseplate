import { FileEntry } from '../types/files';

export interface CompilerOutput {
  config: unknown;
  files: FileEntry[];
}
