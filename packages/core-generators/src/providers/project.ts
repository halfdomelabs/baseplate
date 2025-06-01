import { createReadOnlyProviderType } from '@baseplate-dev/sync';

export interface ProjectProvider {
  getProjectName(): string;
}

export const projectProvider =
  createReadOnlyProviderType<ProjectProvider>('project');
