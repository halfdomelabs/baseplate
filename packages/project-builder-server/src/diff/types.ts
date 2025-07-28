interface BaseFileDiff {
  path: string;
}

interface AddedFileDiff extends BaseFileDiff {
  type: 'added';
  isBinary: false;
  generatedContent: string;
  unifiedDiff: string;
}

interface AddedFileBinaryDiff extends BaseFileDiff {
  type: 'added';
  isBinary: true;
  generatedContent: Buffer;
}

interface ModifiedFileDiff extends BaseFileDiff {
  type: 'modified';
  isBinary: false;
  generatedContent: string;
  workingContent: string;
  unifiedDiff: string;
}

interface ModifiedFileBinaryDiff extends BaseFileDiff {
  type: 'modified';
  isBinary: true;
  generatedContent: Buffer;
  workingContent: Buffer;
}

interface DeletedFileDiff extends BaseFileDiff {
  type: 'deleted';
  isBinary: false;
  workingContent: string;
  unifiedDiff: string;
}

interface DeletedFileBinaryDiff extends BaseFileDiff {
  type: 'deleted';
  isBinary: true;
  workingContent: Buffer;
}

export type FileDiff =
  | AddedFileDiff
  | AddedFileBinaryDiff
  | ModifiedFileDiff
  | ModifiedFileBinaryDiff
  | DeletedFileDiff
  | DeletedFileBinaryDiff;

export interface DiffSummary {
  totalFiles: number;
  addedFiles: number;
  modifiedFiles: number;
  deletedFiles: number;
  diffs: FileDiff[];
}

export interface DiffOptions {
  compact?: boolean;
  appFilter?: string[];
  globPatterns?: string[];
  useIgnoreFile?: boolean;
}
