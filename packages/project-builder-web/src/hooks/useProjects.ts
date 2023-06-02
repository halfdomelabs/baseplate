import { create } from 'zustand';
import { Project } from 'src/services/remote';

interface ProjectsStore {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
}

export const useProjects = create<ProjectsStore>((set) => ({
  projects: [],
  setProjects: (projects) => set({ projects }),
}));
