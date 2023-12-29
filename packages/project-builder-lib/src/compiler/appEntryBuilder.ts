import {
  AdminAppConfig,
  BackendAppConfig,
  BaseAppConfig,
  ProjectConfig,
} from '../schema/index.js';
import { AppEntry, FileEntry } from '../types/files.js';
import { stripObject } from '../utils/strip.js';
import { ProjectDefinitionContainer } from '@src/definition/index.js';
import { ParsedProjectConfig } from '@src/parser/index.js';

export class AppEntryBuilder<AppConfig extends BaseAppConfig = BaseAppConfig> {
  public projectConfig: ProjectConfig;

  public parsedProject: ParsedProjectConfig;

  protected files: FileEntry[] = [];

  constructor(
    public definitionContainer: ProjectDefinitionContainer,
    public appConfig: AppConfig,
  ) {
    this.projectConfig = definitionContainer.definition;
    this.parsedProject = new ParsedProjectConfig(definitionContainer);
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

  nameFromId(id: string): string {
    return this.definitionContainer.nameFromId(id);
  }

  toProjectEntry(): AppEntry {
    return {
      name: `${this.projectConfig.name}-${this.appConfig.name}`,
      rootDirectory: this.appConfig.packageLocation
        ? this.appConfig.packageLocation
        : `packages/${this.appConfig.name}`,
      files: this.files,
    };
  }
}

export type AdminAppEntryBuilder = AppEntryBuilder<AdminAppConfig>;

export type BackendAppEntryBuilder = AppEntryBuilder<BackendAppConfig>;
