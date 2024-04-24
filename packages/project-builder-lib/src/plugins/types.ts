export interface PluginSpecSupport {
  spec: string;
  version: string;
}

export interface PluginSpecDependency {
  spec: string;
  version: string;
}

export interface PluginConfig {
  name: string;
  displayName: string;
  icon?: string;
  description: string;
  version: string;
  supports?: PluginSpecSupport[];
  dependencies?: PluginSpecDependency[];
  nodeImport?: string;
  webEntryImport?: string;
}
