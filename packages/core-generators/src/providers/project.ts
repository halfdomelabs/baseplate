import { createReadOnlyProviderType } from '@halfdomelabs/sync';

export interface ProjectProvider {
  getProjectName(): string;
}

export const projectProvider =
  createReadOnlyProviderType<ProjectProvider>('project');
