import { AxiosError } from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  downloadProjectConfig,
  FilePayload,
  ProjectWebsocketClient,
  uploadProjectConfig,
} from 'src/services/remote';
import { useProjectIdState } from './useProjectIdState';
import { useToast } from './useToast';

interface UseRemoteProjectConfigResult {
  value?: string | null;
  error?: Error;
  loaded: boolean;
  saveValue: (newValue: string) => void;
  /**
   * External change counter gets incremented every time the remote config
   * gets updated externally
   */
  externalChangeCounter: number;
  websocketClient?: ProjectWebsocketClient;
  projectId?: string | null;
}

export function useRemoteProjectConfig(): UseRemoteProjectConfigResult {
  const [file, setFile] = useState<FilePayload | null>();
  const [error, setError] = useState<Error>();
  const [loaded, setLoaded] = useState(false);

  const [projectId, setProjectId] = useProjectIdState();

  const isSavingRef = useRef(false);
  const lastSavedValueRef = useRef<string | null>(null);
  const shouldTriggerRefetch = useRef(false);

  const toast = useToast();

  const [externalChangeCounter, setExternalChangeCounter] = useState(0);

  useEffect(() => {
    setFile(null);
    setError(undefined);
    setLoaded(false);
    setExternalChangeCounter(0);
    lastSavedValueRef.current = null;
  }, [projectId]);

  const updateConfig = useCallback((payload: FilePayload | null): boolean => {
    // skip saving if we already have this value
    if (
      lastSavedValueRef.current &&
      payload?.contents === lastSavedValueRef.current
    ) {
      return false;
    }
    setFile(payload);
    lastSavedValueRef.current = payload?.contents || null;
    return true;
  }, []);

  const downloadConfig = useCallback(async (): Promise<void> => {
    try {
      if (!projectId) {
        throw new Error('No project ID');
      }
      shouldTriggerRefetch.current = false;
      const payload = await downloadProjectConfig(projectId);
      updateConfig(payload);

      setLoaded(true);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 404) {
        toast.error(`Project not found: ${projectId || ''}`);
        setProjectId(null);
        return;
      }
      setError(err as Error);
      toast.error(
        `Error downloading project config: ${(err as Error).message}`
      );
    }
  }, [toast, projectId, setProjectId, updateConfig]);

  useEffect(() => {
    downloadConfig().catch((err) => console.error(err));
  }, [downloadConfig]);

  const pendingSaveContents = useRef<string | null>();

  const saveValue = useCallback(
    (contents: string, lastModifiedAt?: string) => {
      if (!projectId) {
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

      uploadProjectConfig(projectId, {
        contents,
        lastModifiedAt:
          lastModifiedAt || file?.lastModifiedAt || new Date(0).toISOString(),
      })
        .then((result) => {
          if (result.type === 'modified-more-recently') {
            toast.error(
              'Cannot save because project was modified more recently'
            );
            shouldTriggerRefetch.current = true;
          } else if (result.type === 'success') {
            setFile({
              contents,
              lastModifiedAt: result.lastModifiedAt,
            });
            newLastModifiedAt = result.lastModifiedAt;
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
            downloadConfig().catch((err) => console.error(err));
          }
        });
    },
    [toast, projectId, file?.lastModifiedAt, downloadConfig]
  );

  const [websocketClient, setWebsocketClient] = useState<
    ProjectWebsocketClient | undefined
  >();

  useEffect(() => {
    const socket = new ProjectWebsocketClient();

    const unsubscribeError = socket.on('error', (err) => {
      setError(err);
    });

    const unsubscribeConnectionOpened = socket.on('connectionOpened', () => {
      if (projectId) {
        socket.subscribe(projectId);
      }
    });

    const unsubscribeMessage = socket.on('message', (message) => {
      if (message.type === 'project-json-changed') {
        const didChange = updateConfig(message.file);
        if (didChange) {
          setExternalChangeCounter((val) => val + 1);
        }
      }
    });

    setWebsocketClient(socket);

    return () => {
      unsubscribeError();
      unsubscribeConnectionOpened();
      unsubscribeMessage();
      socket.close();
      setWebsocketClient(undefined);
    };
  }, [downloadConfig, updateConfig, projectId]);

  return {
    value: file?.contents,
    error,
    loaded,
    saveValue,
    externalChangeCounter,
    projectId,
    websocketClient,
  };
}
