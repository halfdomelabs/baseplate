import { FileEntry } from '../types/files.js';

export interface CompilerOutput {
  config: unknown;
  files: FileEntry[];
}
