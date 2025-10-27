import type { SchemaParserContext } from '@baseplate-dev/project-builder-lib';

import { toast } from '@baseplate-dev/ui-components';
import { useEffect, useState } from 'react';

import { useClientVersion } from '#src/hooks/use-client-version.js';
import { useProjects } from '#src/hooks/use-projects.js';
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
  const { currentProjectId, projectsLoaded, projects } = useProjects();
  const [schemaParserContext, setSchemaParserContext] = useState<
    SchemaParserContext | undefined
  >(undefined);
  const [error, setError] = useState<unknown>();
  const cliVersion = useClientVersion();

  useEffect(() => {
    setSchemaParserContext(undefined);
    setError(undefined);
    if (!currentProjectId || !projectsLoaded) return;

    const project = projects.find((project) => project.id === currentProjectId);
    if (!project) {
      setError(new Error(`Project with id ${currentProjectId} not found`));
      return;
    }

    const schemaParserContextManager = new SchemaParserContextManager(
      project,
      cliVersion.version,
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
  }, [currentProjectId, projectsLoaded, projects, cliVersion]);

  return { schemaParserContext, error };
}
