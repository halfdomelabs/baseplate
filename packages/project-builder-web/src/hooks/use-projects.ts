import type { ProjectInfo } from '@baseplate-dev/project-builder-server';

import { create } from 'zustand';

import { getLocalStorageProjectId } from '../services/project-id.service.js';

interface ProjectsStore {
  projects: ProjectInfo[];
  projectsLoaded: boolean;
  setProjects: (projects: ProjectInfo[]) => void;
  currentProjectId: string | null;
  setCurrentProjectId: (projectId: string) => void;
  resetCurrentProjectId: () => void;
}

export const useProjects = create<ProjectsStore>((set) => ({
  projects: [],
  projectsLoaded: false,
  setProjects: (projects) => {
    set((state) => ({
      projects,
      projectsLoaded: true,
      ...(projects.some((p) => p.id === state.currentProjectId)
        ? undefined
        : {
            currentProjectId: projects.length === 1 ? projects[0].id : null,
          }),
    }));
  },
  currentProjectId: getLocalStorageProjectId(),
  setCurrentProjectId: (projectId) => {
    set((state) => ({
      currentProjectId: state.projects.some((p) => p.id === projectId)
        ? projectId
        : null,
    }));
  },
  resetCurrentProjectId: () => {
    set((state) => ({
      currentProjectId:
        state.projects.length === 1 ? state.projects[0].id : null,
    }));
  },
}));
