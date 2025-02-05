import type {
  PluginMetadataWithPaths,
  SchemaParserContext,
} from '@halfdomelabs/project-builder-lib';
import type { FilePayload } from '@halfdomelabs/project-builder-server';

import { toast } from '@halfdomelabs/ui-components';
import { TRPCClientError } from '@trpc/client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { logError } from 'src/services/error-logger';

import {
  downloadProjectDefinition,
  getPluginsMetadata,
  uploadProjectDefinition,
} from '@src/services/api';
import { resetPluginModuleSeed } from '@src/services/module-federation';
import { createWebSchemaParserContext } from '@src/services/schema-parser-context';
import { trpc } from '@src/services/trpc';

import { useProjects } from './useProjects';

interface UseRemoteProjectDefinitionResult {
  value?: string | null;
  error?: Error;
  lastModifiedAt?: string;
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
  schemaParserContext?: SchemaParserContext;
}

export function useRemoteProjectDefinition(): UseRemoteProjectDefinitionResult {
  const [file, setFile] = useState<FilePayload | null>();
  const [error, setError] = useState<Error>();
  const [loaded, setLoaded] = useState(false);
  const [schemaParserContext, setSchemaParserContext] =
    useState<SchemaParserContext>();

  const isSavingRef = useRef(false);
  const lastSavedValueRef = useRef<string | null>(null);
  const shouldTriggerRefetch = useRef(false);

  const { currentProjectId, resetCurrentProjectId, projectsLoaded } =
    useProjects();

  const [externalChangeCounter, setExternalChangeCounter] = useState(0);
  const [pluginsMetadata, setPluginsMetadata] =
    useState<PluginMetadataWithPaths[]>();
  const loadedProjectId = useRef<string>();

  useEffect(() => {
    setFile(null);
    setError(undefined);
    setLoaded(false);
    setExternalChangeCounter(0);
    setSchemaParserContext(undefined);
    lastSavedValueRef.current = null;
  }, [currentProjectId]);

  useEffect(() => {
    if (!currentProjectId || !projectsLoaded) {
      return;
    }
    getPluginsMetadata(currentProjectId)
      .then((plugins) => {
        setPluginsMetadata(plugins);
        return createWebSchemaParserContext(currentProjectId, plugins);
      })
      .then((schemaParserContext) => {
        setSchemaParserContext(schemaParserContext);
      })
      .catch((error_: unknown) => {
        setError(error_ as Error);
        logError(error_);
        toast.error(
          `Error loading project plugin configs: ${(error_ as Error).message}`,
        );
      });
  }, [currentProjectId, projectsLoaded]);

  useEffect(() => {
    if (!pluginsMetadata || !currentProjectId) {
      return;
    }
    if (import.meta.hot) {
      // recreate web schema parser context when we hot reload
      const eventHandler = (): void => {
        resetPluginModuleSeed();
        createWebSchemaParserContext(currentProjectId, pluginsMetadata)
          .then((schemaParserContext) => {
            setSchemaParserContext(schemaParserContext);
          })
          .catch((error_: unknown) => {
            setError(error_ as Error);
            logError(error_);
            toast.error(
              `Error reloading project plugin configs: ${(error_ as Error).message}`,
            );
          });
      };
      import.meta.hot.on('plugin-assets-changed', eventHandler);
      return () => {
        import.meta.hot?.off('plugin-assets-changed', eventHandler);
      };
    }
  }, [currentProjectId, pluginsMetadata]);

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
    } catch (error_) {
      if (
        error_ instanceof TRPCClientError &&
        (error_.data as { code?: string }).code === 'NOT_FOUND'
      ) {
        resetCurrentProjectId();
        return;
      }
      setError(error_ as Error);
      toast.error(
        `Error downloading project config: ${(error_ as Error).message}`,
      );
    }
  }, [currentProjectId, resetCurrentProjectId, updateConfig]);

  useEffect(() => {
    downloadConfig().catch((error_: unknown) => {
      logError(error_);
    });
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
          } else if ((result.type as string) === 'success') {
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
        .catch((err: unknown) => {
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
            downloadConfig().catch((error_: unknown) => {
              logError(error_);
            });
          }
        });
    },
    [currentProjectId, file?.lastModifiedAt, downloadConfig],
  );

  useEffect(() => {
    const unsubscribeMessage = trpc.projects.onProjectJsonChanged.subscribe(
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
    lastModifiedAt: file?.lastModifiedAt,
    loaded: loaded && currentProjectId === loadedProjectId.current,
    saveValue,
    externalChangeCounter,
    projectId: currentProjectId,
    downloadConfig,
    schemaParserContext,
  };
}
