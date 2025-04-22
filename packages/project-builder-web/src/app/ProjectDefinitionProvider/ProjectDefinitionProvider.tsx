import type {
  ProjectDefinitionSetter,
  SaveDefinitionWithFeedbackOptions,
  UseProjectDefinitionResult,
} from '@halfdomelabs/project-builder-lib/web';
import type React from 'react';

import {
  createPluginImplementationStore,
  createProjectDefinitionSchemaWithContext,
  fixRefDeletions,
  ProjectDefinitionContainer,
} from '@halfdomelabs/project-builder-lib';
import { ProjectDefinitionContext } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  ErrorableLoader,
  ErrorDisplay,
  toast,
} from '@halfdomelabs/ui-components';
import { produce } from 'immer';
import { useMemo, useState } from 'react';
import semver from 'semver';

import { useClientVersion } from '@src/hooks/useClientVersion';
import { useDeleteReferenceDialog } from '@src/hooks/useDeleteReferenceDialog';
import { useProjects } from '@src/hooks/useProjects';
import { useSyncMetadataListener } from '@src/hooks/useSyncMetadata';
import { formatError, logAndFormatError } from '@src/services/error-formatter';
import { RefDeleteError } from '@src/utils/error';

import { useProjectDefinitionContainer } from './hooks/use-project-definition-container';
import { useRemoteProjectDefinitionContents } from './hooks/use-remote-project-definition-contents';
import { useSchemaParserContext } from './hooks/use-schema-parser-context';
import { NewProjectCard } from './NewProjectCard';

interface ProjectDefinitionProviderProps {
  children?: React.ReactNode;
}

export function ProjectDefinitionProvider({
  children,
}: ProjectDefinitionProviderProps): React.JSX.Element {
  const { schemaParserContext, error: contextError } = useSchemaParserContext();
  const {
    projectDefinitionFilePayload,
    uploadProjectDefinitionContents,
    error: definitionError,
  } = useRemoteProjectDefinitionContents();
  const {
    projectDefinitionContainer,
    error: containerError,
    cacheProjectDefinitionContainer,
  } = useProjectDefinitionContainer({
    schemaParserContext,
    projectDefinitionFilePayload,
  });
  const { projects, resetCurrentProjectId } = useProjects();
  const { version: cliVersion } = useClientVersion();
  const { showRefIssues } = useDeleteReferenceDialog();
  const [isSavingDefinition, setIsSavingDefinition] = useState(false);

  // Listen for sync metadata changes
  useSyncMetadataListener();

  const updatedExternally = !!projectDefinitionFilePayload?.updatedExternally;

  const result: UseProjectDefinitionResult | undefined = useMemo(() => {
    if (!projectDefinitionContainer || !schemaParserContext) return;

    const { definition } = projectDefinitionContainer;
    const parserContext = schemaParserContext;

    async function saveDefinition(
      newConfig: ProjectDefinitionSetter,
    ): Promise<void> {
      setIsSavingDefinition(true);
      try {
        const newProjectDefinition = produce(definition, newConfig);

        const projectDefinitionSchemaWithContext =
          createProjectDefinitionSchemaWithContext(
            newProjectDefinition,
            parserContext,
          );

        const result = fixRefDeletions(
          projectDefinitionSchemaWithContext,
          newProjectDefinition,
        );
        if (result.type === 'failure') {
          throw new RefDeleteError(result.issues);
        }
        const fixedProjectDefinition = result.value;

        fixedProjectDefinition.cliVersion = cliVersion;

        const definitionContainer = new ProjectDefinitionContainer(
          result.refPayload,
          parserContext,
          projectDefinitionSchemaWithContext.pluginStore,
        );
        const serializedContents = definitionContainer.toSerializedContents();

        cacheProjectDefinitionContainer(
          definitionContainer,
          serializedContents,
        );

        await uploadProjectDefinitionContents(serializedContents);
      } finally {
        setIsSavingDefinition(false);
      }
    }

    const pluginContainer = createPluginImplementationStore(
      schemaParserContext.pluginStore,
      definition,
    );

    async function saveDefinitionWithFeedback(
      definition: ProjectDefinitionSetter,
      options: SaveDefinitionWithFeedbackOptions = {},
    ): Promise<{ success: boolean }> {
      return saveDefinition(definition)
        .then(() => {
          toast.success(options.successMessage ?? 'Successfully saved!');
          options.onSuccess?.();
          return { success: true };
        })
        .catch((err: unknown) => {
          if (
            err instanceof RefDeleteError &&
            !options.disableDeleteRefDialog
          ) {
            showRefIssues({ issues: err.issues });
          } else {
            toast.error(
              logAndFormatError(err, `Failed to save project definition.`),
            );
          }
          return { success: false };
        });
    }
    return {
      definition,
      definitionContainer: projectDefinitionContainer,
      saveDefinition,
      saveDefinitionWithFeedback,
      saveDefinitionWithFeedbackSync: (definition, options) => {
        void saveDefinitionWithFeedback(definition, options);
      },
      isSavingDefinition,
      pluginContainer,
      schemaParserContext,
      updatedExternally,
    };
  }, [
    cliVersion,
    projectDefinitionContainer,
    isSavingDefinition,
    schemaParserContext,
    updatedExternally,
    uploadProjectDefinitionContents,
    showRefIssues,
    cacheProjectDefinitionContainer,
  ]);

  const error = contextError ?? definitionError ?? containerError;

  if (!result) {
    return (
      <ErrorableLoader
        error={error && formatError(error, ``)}
        header="Failed to load project config"
        actions={
          <div className="flex flex-col space-y-4">
            {projects.length > 1 && (
              <Button
                variant="secondary"
                onClick={() => {
                  resetCurrentProjectId();
                }}
              >
                Switch Project
              </Button>
            )}
          </div>
        }
      />
    );
  }

  if (!result.definition.isInitialized) {
    return (
      <div className="flex h-full items-center justify-center">
        <NewProjectCard
          existingProject={result.definition}
          saveProject={async (data) => {
            await result.saveDefinition((definition) => {
              Object.assign(definition, data);
              definition.isInitialized = true;
            });
          }}
        />
      </div>
    );
  }

  if (
    result.definition.cliVersion &&
    cliVersion &&
    cliVersion !== 'preview' &&
    semver.gt(result.definition.cliVersion, cliVersion)
  ) {
    return (
      <ErrorDisplay
        header="Upgrade your Baseplate client"
        actions={
          <div className="flex flex-col space-y-4">
            <Button
              onClick={() => {
                globalThis.location.reload();
              }}
            >
              Refresh Page
            </Button>
            {projects.length > 1 && (
              <Button
                variant="secondary"
                onClick={() => {
                  resetCurrentProjectId();
                }}
              >
                Switch Project
              </Button>
            )}
          </div>
        }
        error={
          <>
            This project requires a newer version of the client (
            {result.definition.cliVersion}). Please upgrade your client by
            running <strong>pnpm install</strong>.
          </>
        }
      />
    );
  }

  return (
    <ProjectDefinitionContext.Provider value={result}>
      {children}
    </ProjectDefinitionContext.Provider>
  );
}
