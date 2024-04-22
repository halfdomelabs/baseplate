import {
  AdminAppConfig,
  BackendAppConfig,
  BaseAppConfig,
  ProjectDefinition,
  AppEntry,
  FileEntry,
  ProjectDefinitionContainer,
  ParsedProjectDefinition,
} from '@halfdomelabs/project-builder-lib';

import { stripObject } from '../utils/strip.js';

export class AppEntryBuilder<AppConfig extends BaseAppConfig = BaseAppConfig> {
  public projectDefinition: ProjectDefinition;

  public parsedProject: ParsedProjectDefinition;

  protected files: FileEntry[] = [];

  constructor(
    public definitionContainer: ProjectDefinitionContainer,
    public appConfig: AppConfig,
  ) {
    this.projectDefinition = definitionContainer.definition;
    this.parsedProject = new ParsedProjectDefinition(definitionContainer);
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

  nameFromId(id: string): string;
  nameFromId(id: string | undefined): string | undefined {
    return this.definitionContainer.nameFromId(id);
  }

  toProjectEntry(): AppEntry {
    return {
      name: `${this.projectDefinition.name}-${this.appConfig.name}`,
      rootDirectory: this.appConfig.packageLocation
        ? this.appConfig.packageLocation
        : `packages/${this.appConfig.name}`,
      files: this.files,
    };
  }
}

export type AdminAppEntryBuilder = AppEntryBuilder<AdminAppConfig>;

export type BackendAppEntryBuilder = AppEntryBuilder<BackendAppConfig>;
