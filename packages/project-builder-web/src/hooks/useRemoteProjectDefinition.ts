import { TRPCClientError } from '@trpc/client';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useProjects } from './useProjects';
import { useToast } from './useToast';
import { client } from '@src/services/api';
import { logError } from 'src/services/error-logger';
import {
  downloadProjectDefinition,
  FilePayload,
  uploadProjectDefinition,
} from 'src/services/remote';

interface UseRemoteProjectDefinitionResult {
  value?: string | null;
  error?: Error;
  loaded: boolean;
  saveValue: (
    newValue: string,
    lastModifiedAt?: string,
    successCallback?: () => void,
  ) => void;
  /**
   * External change counter gets incremented every time the remote config
   * gets updated externally
   */
  externalChangeCounter: number;
  projectId?: string | null;
  downloadConfig: () => Promise<void>;
}

export function useRemoteProjectDefinition(): UseRemoteProjectDefinitionResult {
  const [file, setFile] = useState<FilePayload | null>();
  const [error, setError] = useState<Error>();
  const [loaded, setLoaded] = useState(false);

  const isSavingRef = useRef(false);
  const lastSavedValueRef = useRef<string | null>(null);
  const shouldTriggerRefetch = useRef(false);

  const toast = useToast();

  const { currentProjectId, resetCurrentProjectId } = useProjects();

  const [externalChangeCounter, setExternalChangeCounter] = useState(0);
  const loadedProjectId = useRef<string>();

  useEffect(() => {
    setFile(null);
    setError(undefined);
    setLoaded(false);
    setExternalChangeCounter(0);
    lastSavedValueRef.current = null;
  }, [currentProjectId]);

  const updateConfig = useCallback((payload: FilePayload | null): boolean => {
    // skip saving if we already have this value
    if (
      lastSavedValueRef.current &&
      payload?.contents === lastSavedValueRef.current
    ) {
      return false;
    }
    setFile(payload);
    lastSavedValueRef.current = payload?.contents ?? null;
    return true;
  }, []);

  const downloadConfig = useCallback(async (): Promise<void> => {
    try {
      if (!currentProjectId) {
        throw new Error('No project ID');
      }
      setError(undefined);
      shouldTriggerRefetch.current = false;
      const payload = await downloadProjectDefinition(currentProjectId);
      updateConfig(payload);

      setLoaded(true);
      loadedProjectId.current = currentProjectId;
    } catch (err) {
      if (
        err instanceof TRPCClientError &&
        (err.data as { code?: string })?.code === 'NOT_FOUND'
      ) {
        resetCurrentProjectId();
        return;
      }
      setError(err as Error);
      toast.error(
        `Error downloading project config: ${(err as Error).message}`,
      );
    }
  }, [toast, currentProjectId, resetCurrentProjectId, updateConfig]);

  useEffect(() => {
    downloadConfig().catch((err) => logError(err));
  }, [downloadConfig]);

  const pendingSaveContents = useRef<string | null>();

  const saveValue = useCallback(
    (
      contents: string,
      lastModifiedAt?: string,
      successCallback?: () => void,
    ) => {
      if (!currentProjectId) {
        throw new Error('No project ID');
      }
      if (isSavingRef.current) {
        pendingSaveContents.current = contents;
        return;
      }

      isSavingRef.current = true;
      let newLastModifiedAt: string | undefined;

      const oldSavedValue = lastSavedValueRef.current;
      lastSavedValueRef.current = contents;

      uploadProjectDefinition(currentProjectId, {
        contents,
        lastModifiedAt:
          lastModifiedAt ?? file?.lastModifiedAt ?? new Date(0).toISOString(),
      })
        .then((result) => {
          if (result.type === 'modified-more-recently') {
            toast.error(
              'Cannot save because project was modified more recently',
            );
            shouldTriggerRefetch.current = true;
          } else if (result.type === 'success') {
            setFile({
              contents,
              lastModifiedAt: result.lastModifiedAt,
            });
            newLastModifiedAt = result.lastModifiedAt;
            if (successCallback) {
              successCallback();
            }
          } else {
            throw new Error('Unexpected result type');
          }
        })
        .catch((err) => {
          lastSavedValueRef.current = oldSavedValue;
          toast.error(`Cannot save: ${(err as Error).message}`);
        })
        .finally(() => {
          isSavingRef.current = false;
          // attempt to save newer value if a save happened in the background
          if (pendingSaveContents.current) {
            saveValue(pendingSaveContents.current, newLastModifiedAt);
          }
          if (shouldTriggerRefetch.current) {
            downloadConfig().catch((err) => logError(err));
          }
        });
    },
    [toast, currentProjectId, file?.lastModifiedAt, downloadConfig],
  );

  useEffect(() => {
    const unsubscribeMessage = client.projects.onProjectJsonChanged.subscribe(
      { id: currentProjectId ?? '' },
      {
        onData: (value) => {
          if (!currentProjectId) {
            return;
          }
          const didChange = updateConfig(value);
          if (didChange) {
            setExternalChangeCounter((val) => val + 1);
          }
        },
      },
    );

    return () => {
      unsubscribeMessage.unsubscribe();
    };
  }, [downloadConfig, updateConfig, currentProjectId]);

  return {
    value: file?.contents,
    error,
    loaded: loaded && currentProjectId === loadedProjectId.current,
    saveValue,
    externalChangeCounter,
    projectId: currentProjectId,
    downloadConfig,
  };
}
