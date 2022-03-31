import { ParsedAppConfig } from '@src/parser';
import { AppConfig } from '../schema';
import { ProjectEntry, FileEntry } from '../types/files';
import { stripObject } from '../utils/strip';

export class ProjectEntryBuilder {
  public parsedApp: ParsedAppConfig;

  protected files: FileEntry[] = [];

  constructor(
    public appConfig: AppConfig,
    protected name: string,
    protected rootDirectory: string
  ) {
    this.parsedApp = new ParsedAppConfig(appConfig);
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

  toProjectEntry(): ProjectEntry {
    return {
      name: this.name,
      rootDirectory: this.rootDirectory,
      files: this.files,
    };
  }
}
