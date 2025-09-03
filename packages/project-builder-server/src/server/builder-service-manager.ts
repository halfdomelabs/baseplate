import type { ServiceActionContext } from '#src/actions/types.js';

import { generateProjectId } from '#src/actions/utils/project-id.js';
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
    for (const directory of this.options.serviceActionContext.projects.map(
      (project) => project.directory,
    )) {
      this.addService(directory);
    }
  }

  addService(directory: string): ProjectBuilderService {
    const id = generateProjectId(directory);
    const service = new ProjectBuilderService({
      directory,
      id,
      cliVersion: this.options.cliVersion,
      skipCommands: this.options.skipCommands,
      cliFilePath: this.options.cliFilePath,
      serviceActionContext: this.options.serviceActionContext,
    });
    service.init();
    this.services.set(id, service);
    return service;
  }

  getService(id: string): ProjectBuilderService | undefined {
    return this.services.get(id);
  }

  getServices(): ProjectBuilderService[] {
    return [...this.services.values()];
  }

  removeService(id: string): void {
    const service = this.services.get(id);
    if (!service) {
      throw new Error(`Service with id ${id} not found`);
    }
    service.close();
    this.services.delete(id);
  }

  removeAllServices(): void {
    for (const service of this.services.values()) {
      service.close();
    }
    this.services.clear();
  }
}
