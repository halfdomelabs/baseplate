import { createProviderType } from '@baseplate/sync';

export interface ProjectProvider {
  getProjectName(): string;
}

export const projectProvider = createProviderType<ProjectProvider>('project');
