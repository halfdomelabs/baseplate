import type { ProjectInfo } from '@baseplate-dev/project-builder-lib';

import type { ServiceActionContext } from '#src/actions/types.js';

import { ProjectBuilderService } from '#src/service/builder-service.js';

export class BuilderServiceManager {
  private services = new Map<string, ProjectBuilderService>();

  constructor(
    protected options: {
      cliVersion: string;
      /**
       * Whether to skip running commands for use in testing.
       */
      skipCommands?: boolean;
      /**
       * The path to the CLI file that was executed to start the sync.
       */
      cliFilePath?: string;
      /**
       * The context for the service actions.
       */
      serviceActionContext: ServiceActionContext;
    },
  ) {
    for (const project of this.options.serviceActionContext.projects) {
      this.addService(project);
    }
  }

  addService(project: ProjectInfo): ProjectBuilderService {
    const service = new ProjectBuilderService({
      project,
      cliVersion: this.options.cliVersion,
      skipCommands: this.options.skipCommands,
      cliFilePath: this.options.cliFilePath,
      serviceActionContext: this.options.serviceActionContext,
    });
    service.init();
    this.services.set(project.id, service);
    return service;
  }

  getService(id: string): ProjectBuilderService | undefined {
    return this.services.get(id);
  }

  getServices(): ProjectBuilderService[] {
    return [...this.services.values()];
  }

  async removeService(id: string): Promise<void> {
    const service = this.services.get(id);
    if (!service) {
      throw new Error(`Service with id ${id} not found`);
    }
    await service.close();
    this.services.delete(id);
  }

  async removeAllServices(): Promise<void> {
    await Promise.all(
      [...this.services.values()].map((service) => service.close()),
    );
    this.services.clear();
  }
}
