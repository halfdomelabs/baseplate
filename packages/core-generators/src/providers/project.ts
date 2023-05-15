import { createProviderType } from '@halfdomelabs/sync';

export interface ProjectProvider {
  getProjectName(): string;
}

export const projectProvider = createProviderType<ProjectProvider>('project');
