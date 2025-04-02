import type { PluginMetadataWithPaths } from '@halfdomelabs/project-builder-lib';

import crypto from 'node:crypto';

import { ProjectBuilderService } from '@src/service/builder-service.js';

export class BuilderServiceManager {
  private services = new Map<string, ProjectBuilderService>();

  constructor(
    protected options: {
      initialDirectories?: string[];
      cliVersion: string;
      builtInPlugins: PluginMetadataWithPaths[];
    },
  ) {
    for (const directory of this.options.initialDirectories ?? []) {
      this.addService(directory);
    }
  }

  addService(directory: string): ProjectBuilderService {
    const id = crypto
      .createHash('shake256', { outputLength: 9 })
      .update(directory)
      .digest('base64')
      .replaceAll('/', '-')
      .replaceAll('+', '_');
    const service = new ProjectBuilderService({
      directory,
      id,
      cliVersion: this.options.cliVersion,
      builtInPlugins: this.options.builtInPlugins,
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
