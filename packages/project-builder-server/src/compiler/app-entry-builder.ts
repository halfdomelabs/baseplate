import type {
  AppCompiler,
  AppEntry,
  AppEntryType,
  BackendAppConfig,
  BaseAppConfig,
  PluginImplementationStore,
  ProjectDefinition,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import {
  appCompilerSpec,
  AppUtils,
  createAppCompiler,
} from '@baseplate-dev/project-builder-lib';

export class AppEntryBuilder<AppConfig extends BaseAppConfig = BaseAppConfig> {
  public projectDefinition: ProjectDefinition;

  public pluginStore: PluginImplementationStore;

  public appCompiler: AppCompiler;

  constructor(
    public definitionContainer: ProjectDefinitionContainer,
    public appConfig: AppConfig,
    public appConfigType: AppEntryType<AppConfig>,
  ) {
    this.projectDefinition = definitionContainer.definition;
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
      id: this.appConfig.id,
      name: `${this.projectDefinition.settings.general.name}-${this.appConfig.name}`,
      appDirectory: AppUtils.getAppDirectory(this.appConfig),
      generatorBundle: rootBundle,
    };
  }
}

export type BackendAppEntryBuilder = AppEntryBuilder<BackendAppConfig>;
