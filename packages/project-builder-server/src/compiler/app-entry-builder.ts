import type {
  AdminAppConfig,
  AppCompiler,
  AppEntry,
  AppEntryType,
  BackendAppConfig,
  BaseAppConfig,
  FileEntry,
  PluginImplementationStore,
  ProjectDefinition,
  ProjectDefinitionContainer,
} from '@halfdomelabs/project-builder-lib';
import type { AppPluginConfig } from '@halfdomelabs/sync';

import {
  appCompilerSpec,
  createAppCompiler,
  ParsedProjectDefinition,
} from '@halfdomelabs/project-builder-lib';
import _ from 'lodash';

export class AppEntryBuilder<AppConfig extends BaseAppConfig = BaseAppConfig> {
  public projectDefinition: ProjectDefinition;

  public parsedProject: ParsedProjectDefinition;

  public pluginStore: PluginImplementationStore;

  public appCompiler: AppCompiler;

  protected files: FileEntry[] = [];

  constructor(
    public definitionContainer: ProjectDefinitionContainer,
    public appConfig: AppConfig,
    public appConfigType: AppEntryType<AppConfig>,
  ) {
    this.projectDefinition = definitionContainer.definition;
    this.parsedProject = new ParsedProjectDefinition(definitionContainer);
    this.addDescriptor = this.addDescriptor.bind(this);
    this.toProjectEntry = this.toProjectEntry.bind(this);
    this.pluginStore = definitionContainer.pluginStore;

    // initialize app compiler
    this.appCompiler = createAppCompiler();
    const appCompilerStore = this.pluginStore.getPluginSpec(appCompilerSpec);

    const pluginCompilers = appCompilerStore.getAppCompilers(appConfigType);
    for (const compiler of pluginCompilers) {
      compiler.compile({
        appDefinition: appConfig,
        appCompiler: this.appCompiler,
        projectDefinition: this.projectDefinition,
        definitionContainer: this.definitionContainer,
      });
    }

    // add plugin.json to root
    this.addDescriptor('plugins.json', {
      plugins: _.uniq(
        this.projectDefinition.plugins?.map((p) => ({
          name: p.packageName,
        })) ?? [],
      ),
    } satisfies AppPluginConfig);
  }

  addDescriptor(path: string, jsonContent: unknown): this {
    // check for existing paths
    if (this.files.some((f) => f.path === `baseplate/${path}`)) {
      throw new Error(`File already exists at path ${path}`);
    }
    this.files.push({
      path: `baseplate/${path}`,
      jsonContent,
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
