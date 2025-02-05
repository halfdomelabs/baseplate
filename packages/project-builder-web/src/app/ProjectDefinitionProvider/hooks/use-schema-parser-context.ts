import type {
  PluginMetadataWithPaths,
  SchemaParserContext,
} from '@halfdomelabs/project-builder-lib';

import { toast, useEventCallback } from '@halfdomelabs/ui-components';
import { useEffect, useState } from 'react';

import { useProjects } from '@src/hooks/useProjects';
import { getPluginsMetadata } from '@src/services/api';
import { logAndFormatError } from '@src/services/error-formatter';
import { resetPluginModuleSeed } from '@src/services/module-federation';
import { createWebSchemaParserContext } from '@src/services/schema-parser-context';

/**
 * Fetches the plugins metadata and creates a schema parser context.
 *
 * @returns The plugins metadata and schema parser context.
 */
export function useSchemaParserContext({
  onError,
}: {
  onError?: (error: unknown) => void;
} = {}): {
  schemaParserContext: SchemaParserContext | undefined;
  error?: unknown;
} {
  const [pluginsMetadata, setPluginsMetadata] = useState<
    PluginMetadataWithPaths[] | undefined
  >();
  const [schemaParserContext, setSchemaParserContext] = useState<
    SchemaParserContext | undefined
  >();
  const [error, setError] = useState<unknown>();
  const { currentProjectId, projectsLoaded } = useProjects();

  const handleError = useEventCallback(onError);

  // Load the plugins metadata and create the schema parser context
  useEffect(() => {
    if (!projectsLoaded) return;

    setPluginsMetadata(undefined);
    setSchemaParserContext(undefined);
    setError(undefined);

    if (!currentProjectId) return;

    getPluginsMetadata(currentProjectId)
      .then((plugins) => {
        setPluginsMetadata(plugins);
        return createWebSchemaParserContext(currentProjectId, plugins);
      })
      .then((schemaParserContext) => {
        setSchemaParserContext(schemaParserContext);
      })
      .catch((err: unknown) => {
        handleError?.(err);
        toast.error(
          logAndFormatError(err, 'Error loading project plugin configs.'),
        );
      });
  }, [currentProjectId, projectsLoaded, handleError]);

  // Hot reload the schema parser context when the plugin assets change
  useEffect(() => {
    if (!pluginsMetadata || !currentProjectId) {
      return;
    }
    if (import.meta.hot) {
      const eventHandler = (): void => {
        resetPluginModuleSeed();
        createWebSchemaParserContext(currentProjectId, pluginsMetadata)
          .then((schemaParserContext) => {
            setSchemaParserContext(schemaParserContext);
          })
          .catch((err: unknown) => {
            handleError?.(err);
            toast.error(
              logAndFormatError(err, 'Error reloading project plugin configs.'),
            );
          });
      };
      import.meta.hot.on('plugin-assets-changed', eventHandler);
      return () => {
        import.meta.hot?.off('plugin-assets-changed', eventHandler);
      };
    }
  }, [currentProjectId, pluginsMetadata, handleError]);

  return { schemaParserContext, error };
}
