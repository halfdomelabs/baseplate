import { ParsedProjectConfig } from '@src/parser/index.js';
import { BaseAppConfig, ProjectConfig } from '../schema/index.js';
import { AppEntry, FileEntry } from '../types/files.js';
import { stripObject } from '../utils/strip.js';

export class AppEntryBuilder<AppConfig extends BaseAppConfig = BaseAppConfig> {
  public parsedProject: ParsedProjectConfig;

  protected files: FileEntry[] = [];

  constructor(
    public projectConfig: ProjectConfig,
    public appConfig: AppConfig
  ) {
    this.parsedProject = new ParsedProjectConfig(projectConfig);
    this.addDescriptor = this.addDescriptor.bind(this);
    this.toProjectEntry = this.toProjectEntry.bind(this);
  }

  addDescriptor(path: string, jsonContent: unknown): this {
    this.files.push({
      path: `baseplate/${path}`,
      jsonContent: stripObject(jsonContent),
    });
    return this;
  }

  toProjectEntry(): AppEntry {
    return {
      name: `${this.projectConfig.name}-${this.appConfig.name}`,
      rootDirectory:
        this.appConfig.packageLocation || `packages/${this.appConfig.name}`,
      files: this.files,
    };
  }
}
