import type { Project } from 'src/services/remote';

import { create } from 'zustand';

import { getLocalStorageProjectId } from '../services/project-id.service';

interface ProjectsStore {
  projects: Project[];
  projectsLoaded: boolean;
  setProjects: (projects: Project[]) => void;
  currentProjectId: string | null;
  setCurrentProjectId: (projectId: string) => void;
  resetCurrentProjectId: () => void;
  lastSyncedAt: Date | null;
  setLastSyncedAt: (lastSyncedAt: Date) => void;
}

export const useProjects = create<ProjectsStore>((set) => ({
  projects: [],
  projectsLoaded: false,
  lastSyncedAt: null,
  setLastSyncedAt: (lastSyncedAt) => {
    set({ lastSyncedAt });
  },
  setProjects: (projects) => {
    set((state) => ({
      projects,
      projectsLoaded: true,
      ...(projects.some((p) => p.id === state.currentProjectId)
        ? undefined
        : {
            currentProjectId: projects.length === 1 ? projects[0].id : null,
            lastSyncedAt: null,
          }),
    }));
  },
  currentProjectId: getLocalStorageProjectId(),
  setCurrentProjectId: (projectId) => {
    set((state) => ({
      currentProjectId: state.projects.some((p) => p.id === projectId)
        ? projectId
        : null,
      lastSyncedAt: null,
    }));
  },
  resetCurrentProjectId: () => {
    set((state) => ({
      currentProjectId:
        state.projects.length === 1 ? state.projects[0].id : null,
      lastSyncedAt: null,
    }));
  },
}));
