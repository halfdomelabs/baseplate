import { useCallback, useEffect, useState } from 'react';

import { useProjects } from '@src/hooks/useProjects';
import { ProjectNotFoundError } from '@src/services/api';

import type { ProjectDefinitionFilePayload } from '../services/project-definition-file-manager';

import { ProjectDefinitionFileManager } from '../services/project-definition-file-manager';

interface UseRemoteProjectDefinitionResult {
  projectDefinitionFilePayload: ProjectDefinitionFilePayload | undefined;
  uploadProjectDefinitionContents: (newContents: string) => Promise<void>;
  error: unknown;
}

export function useRemoteProjectDefinitionContents(): UseRemoteProjectDefinitionResult {
  const [projectDefinitionFilePayload, setProjectDefinitionFilePayload] =
    useState<ProjectDefinitionFilePayload | undefined>();
  const [error, setError] = useState<unknown>();
  const [projectDefinitionFileManager, setProjectDefinitionFileManager] =
    useState<ProjectDefinitionFileManager | undefined>();
  const { currentProjectId, projectsLoaded, resetCurrentProjectId } =
    useProjects();

  // Download the definition file contents and listen for changes
  useEffect(() => {
    setProjectDefinitionFilePayload(undefined);
    setError(undefined);
    if (!currentProjectId || !projectsLoaded) {
      setProjectDefinitionFileManager(undefined);
      return;
    }

    const projectDefinitionFileManager = new ProjectDefinitionFileManager(
      currentProjectId,
    );

    setProjectDefinitionFileManager(projectDefinitionFileManager);

    projectDefinitionFileManager
      .downloadDefinitionContents()
      .then((payload) => {
        setProjectDefinitionFilePayload(payload);
      })
      .catch((err: unknown) => {
        if (err instanceof ProjectNotFoundError) {
          resetCurrentProjectId();
        } else {
          setError(err);
        }
      });

    return projectDefinitionFileManager.listenForDefinitionFileChanges(
      (payload) => {
        setProjectDefinitionFilePayload(payload);
      },
    );
  }, [currentProjectId, projectsLoaded, resetCurrentProjectId]);

  const uploadProjectDefinitionContents = useCallback(
    async (newContents: string) => {
      if (!projectDefinitionFileManager) {
        throw new Error('Project definition file manager not found');
      }

      await projectDefinitionFileManager
        .uploadDefinitionContents(newContents)
        .catch((err: unknown) => {
          if (err instanceof ProjectNotFoundError) {
            resetCurrentProjectId();
          }
          throw err;
        });
    },
    [projectDefinitionFileManager, resetCurrentProjectId],
  );

  return {
    projectDefinitionFilePayload,
    uploadProjectDefinitionContents,
    error,
  };
}
