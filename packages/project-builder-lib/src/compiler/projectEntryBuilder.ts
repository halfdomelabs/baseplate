import { ParsedProjectConfig } from '@src/parser';
import { ProjectConfig } from '../schema';
import { AppEntry, FileEntry } from '../types/files';
import { stripObject } from '../utils/strip';

export class AppEntryBuilder {
  public parsedProject: ParsedProjectConfig;

  protected files: FileEntry[] = [];

  constructor(
    public projectConfig: ProjectConfig,
    protected name: string,
    protected rootDirectory: string
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
      name: this.name,
      rootDirectory: this.rootDirectory,
      files: this.files,
    };
  }
}
