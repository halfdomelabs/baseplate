import type {
  BaseAppConfig,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';

import { buildPackageName, PackageCompiler } from './package-compiler.js';

export abstract class AppCompiler<
  TAppConfig extends BaseAppConfig,
> extends PackageCompiler {
  protected readonly appConfig: TAppConfig;

  constructor(
    definitionContainer: ProjectDefinitionContainer,
    appConfig: TAppConfig,
  ) {
    super(definitionContainer);
    this.appConfig = appConfig;
  }

  getPackageName(): string {
    const generalSettings =
      this.definitionContainer.definition.settings.general;
    return buildPackageName(generalSettings, this.appConfig.name);
  }

  getPackageDirectory(): string {
    const monorepoSettings =
      this.definitionContainer.definition.settings.monorepo;
    const appsFolder = monorepoSettings?.appsFolder ?? 'apps';
    return `${appsFolder}/${this.appConfig.name}`;
  }
}
