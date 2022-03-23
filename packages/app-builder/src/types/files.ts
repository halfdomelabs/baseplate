export interface FileEntry {
  path: string;
  jsonContent: unknown;
}

export interface ProjectEntry {
  name: string;
  rootDirectory: string;
  files: FileEntry[];
}
