export interface FileDiff {
  path: string;
  type: 'added' | 'modified' | 'deleted';
  generatedContent?: string | Buffer;
  workingContent?: string | Buffer;
  isBinary: boolean;
  unifiedDiff?: string;
}

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
}
