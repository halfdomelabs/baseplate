import type { SchemaParserContext } from '@halfdomelabs/project-builder-lib';

import { toast } from '@halfdomelabs/ui-components';
import { useEffect, useState } from 'react';

import { useProjects } from '#src/hooks/useProjects.js';
import { logAndFormatError } from '#src/services/error-formatter.js';

import { SchemaParserContextManager } from '../services/schema-parser-context-manager.js';

interface UseSchemaParserContextResult {
  schemaParserContext: SchemaParserContext | undefined;
  error?: unknown;
}

/**
 * Fetches the plugins metadata and creates a schema parser context.
 *
 * @returns The schema parser context.
 */
export function useSchemaParserContext(): UseSchemaParserContextResult {
  const { currentProjectId, projectsLoaded } = useProjects();
  const [schemaParserContext, setSchemaParserContext] = useState<
    SchemaParserContext | undefined
  >(undefined);
  const [error, setError] = useState<unknown>();

  useEffect(() => {
    setSchemaParserContext(undefined);
    setError(undefined);
    if (!currentProjectId || !projectsLoaded) return;

    const schemaParserContextManager = new SchemaParserContextManager(
      currentProjectId,
    );

    schemaParserContextManager
      .loadSchemaParserContext()
      .then((schemaParserContext) => {
        setSchemaParserContext(schemaParserContext);
      })
      .catch((err: unknown) => {
        toast.error(logAndFormatError(err));
        setError(err);
      });

    return schemaParserContextManager.listenForPluginAssetsChanges(
      (schemaParserContext) => {
        setSchemaParserContext(schemaParserContext);
      },
      (error) => {
        toast.error(logAndFormatError(error));
      },
    );
  }, [currentProjectId, projectsLoaded]);

  return { schemaParserContext, error };
}
