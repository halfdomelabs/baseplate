import { createOutputProviderType } from '@halfdomelabs/sync';

export interface ProjectProvider {
  getProjectName(): string;
}

export const projectProvider =
  createOutputProviderType<ProjectProvider>('project');
