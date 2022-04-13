export interface FileEntry {
  path: string;
  jsonContent: unknown;
}

export interface AppEntry {
  name: string;
  rootDirectory: string;
  files: FileEntry[];
}
