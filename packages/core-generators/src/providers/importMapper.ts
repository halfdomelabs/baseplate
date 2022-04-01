export interface ImportEntry {
  path: string;
  allowedImports: string[];
  // callback when import is used
  onImportUsed: () => void;
}

/**
 * Key: Import name to map
 * Value: The path to resolve to
 * e.g. '%components' => {path: '@/src/components', allowedImports: ["Alert"]}
 */
export interface ImportMap {
  [key: string]: ImportEntry;
}

export interface ImportMapper {
  getImportMap(): ImportMap;
}
