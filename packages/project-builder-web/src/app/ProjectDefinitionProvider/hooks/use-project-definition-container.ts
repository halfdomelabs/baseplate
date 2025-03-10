import type {
  ProjectDefinitionContainer,
  SchemaParserContext,
} from '@halfdomelabs/project-builder-lib';
import type { ProjectDefinitionFilePayload } from '@halfdomelabs/project-builder-server';

import { useCallback, useEffect, useMemo, useRef } from 'react';

import { parseProjectDefinitionContents } from '../services/parse-project-definition-contents';

interface UseProjectDefinitionContainerInput {
  schemaParserContext: SchemaParserContext | undefined;
  projectDefinitionFilePayload: ProjectDefinitionFilePayload | undefined;
}

interface UseProjectDefinitionContainerResult {
  projectDefinitionContainer: ProjectDefinitionContainer | undefined;
  error: unknown;
  cacheProjectDefinitionContainer: (
    projectDefinitionContainer: ProjectDefinitionContainer,
    seralizedContents: string,
  ) => void;
}

export function useProjectDefinitionContainer({
  schemaParserContext,
  projectDefinitionFilePayload,
}: UseProjectDefinitionContainerInput): UseProjectDefinitionContainerResult {
  const cachedProjectDefinitionContainerRef = useRef<
    { container: ProjectDefinitionContainer; contents: string } | undefined
  >(undefined);
  const { projectDefinitionContainer, error } = useMemo(() => {
    try {
      if (!schemaParserContext || !projectDefinitionFilePayload) {
        return {
          projectDefinitionContainer: undefined,
          error: undefined,
        };
      }

      if (
        cachedProjectDefinitionContainerRef.current?.contents ===
        projectDefinitionFilePayload.contents
      ) {
        return {
          projectDefinitionContainer: {
            container: cachedProjectDefinitionContainerRef.current.container,
            hash: projectDefinitionFilePayload.hash,
          },
          error: undefined,
        };
      }

      const definitionContainer = parseProjectDefinitionContents(
        projectDefinitionFilePayload.contents,
        schemaParserContext,
      );

      return {
        projectDefinitionContainer: {
          container: definitionContainer,
          hash: projectDefinitionFilePayload.hash,
        },
        error: undefined,
      };
    } catch (err) {
      return {
        projectDefinitionContainer: undefined,
        error: err,
      };
    }
  }, [schemaParserContext, projectDefinitionFilePayload]);

  useEffect(() => {
    if (error) {
      console.error(error);
    }
  }, [error]);

  return {
    projectDefinitionContainer: projectDefinitionContainer?.container,
    cacheProjectDefinitionContainer: useCallback(
      (
        projectDefinitionContainer: ProjectDefinitionContainer,
        serializedContents: string,
      ) => {
        cachedProjectDefinitionContainerRef.current = {
          container: projectDefinitionContainer,
          contents: serializedContents,
        };
      },
      [],
    ),
    error,
  };
}
