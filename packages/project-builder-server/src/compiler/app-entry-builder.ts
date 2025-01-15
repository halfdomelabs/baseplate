import type {
  AdminAppConfig,
  AppCompiler,
  AppEntry,
  AppEntryType,
  BackendAppConfig,
  BaseAppConfig,
  PluginImplementationStore,
  ProjectDefinition,
  ProjectDefinitionContainer,
} from '@halfdomelabs/project-builder-lib';
import type { GeneratorBundle } from '@halfdomelabs/sync';

import {
  appCompilerSpec,
  createAppCompiler,
  ParsedProjectDefinition,
} from '@halfdomelabs/project-builder-lib';

export class AppEntryBuilder<AppConfig extends BaseAppConfig = BaseAppConfig> {
  public projectDefinition: ProjectDefinition;

  public parsedProject: ParsedProjectDefinition;

  public pluginStore: PluginImplementationStore;

  public appCompiler: AppCompiler;

  constructor(
    public definitionContainer: ProjectDefinitionContainer,
    public appConfig: AppConfig,
    public appConfigType: AppEntryType<AppConfig>,
  ) {
    this.projectDefinition = definitionContainer.definition;
    this.parsedProject = new ParsedProjectDefinition(definitionContainer);
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
  }

  nameFromId(id: string): string;
  nameFromId(id: string | undefined): string | undefined {
    return this.definitionContainer.nameFromId(id);
  }

  /**
   * Builds an AppEntry from the root bundle
   */
  buildProjectEntry(rootBundle: GeneratorBundle): AppEntry {
    return {
      name: `${this.projectDefinition.name}-${this.appConfig.name}`,
      appDirectory: this.appConfig.packageLocation
        ? this.appConfig.packageLocation
        : `packages/${this.appConfig.name}`,
      generatorBundle: rootBundle,
    };
  }
}

export type AdminAppEntryBuilder = AppEntryBuilder<AdminAppConfig>;

export type BackendAppEntryBuilder = AppEntryBuilder<BackendAppConfig>;
