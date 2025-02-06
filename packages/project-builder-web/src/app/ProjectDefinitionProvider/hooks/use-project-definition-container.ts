import type {
  ProjectDefinitionContainer,
  SchemaParserContext,
} from '@halfdomelabs/project-builder-lib';
import type { ProjectDefinitionFilePayload } from '@halfdomelabs/project-builder-server';

import { useMemo } from 'react';

import { parseProjectDefinitionContents } from '../services/parse-project-definition-contents';

interface UseProjectDefinitionContainerInput {
  schemaParserContext: SchemaParserContext | undefined;
  projectDefinitionFilePayload: ProjectDefinitionFilePayload | undefined;
}

interface UseProjectDefinitionContainerResult {
  projectDefinitionContainer: ProjectDefinitionContainer | undefined;
  error: unknown;
}

export function useProjectDefinitionContainer({
  schemaParserContext,
  projectDefinitionFilePayload,
}: UseProjectDefinitionContainerInput): UseProjectDefinitionContainerResult {
  const { projectDefinitionContainer, error } = useMemo(() => {
    try {
      if (!schemaParserContext || !projectDefinitionFilePayload) {
        return {
          projectDefinitionContainer: undefined,
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

  return {
    projectDefinitionContainer: projectDefinitionContainer?.container,
    error,
  };
}
