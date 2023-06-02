import { create } from 'zustand';
import { Project } from 'src/services/remote';

interface ProjectsStore {
  projects: Project[];
  projectsLoaded: boolean;
  setProjects: (projects: Project[]) => void;
}

export const useProjects = create<ProjectsStore>((set) => ({
  projects: [],
  projectsLoaded: false,
  setProjects: (projects) => set({ projects, projectsLoaded: true }),
}));
