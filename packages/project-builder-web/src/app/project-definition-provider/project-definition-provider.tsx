import type { ProjectDefinition } from '@baseplate-dev/project-builder-lib';
import type {
  ProjectDefinitionSetter,
  SaveDefinitionWithFeedbackOptions,
  UseProjectDefinitionResult,
} from '@baseplate-dev/project-builder-lib/web';
import type React from 'react';

import {
  applyDefinitionFixes,
  collectDefinitionIssues,
  createDefinitionSchemaParserContext,
  createPluginSpecStore,
  createProjectDefinitionSchema,
  fixRefDeletions,
  partitionIssuesBySeverity,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';
import { ProjectDefinitionContext } from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  ErrorableLoader,
  ErrorDisplay,
  toast,
} from '@baseplate-dev/ui-components';
import { produce } from 'immer';
import { useEffect, useMemo, useRef, useState } from 'react';
import semver from 'semver';

import { useClientVersion } from '#src/hooks/use-client-version.js';
import { useDeleteReferenceDialog } from '#src/hooks/use-delete-reference-dialog.js';
import { useProjects } from '#src/hooks/use-projects.js';
import { useSyncMetadataListener } from '#src/hooks/use-sync-metadata.js';
import { router } from '#src/router.js';
import {
  formatError,
  logAndFormatError,
} from '#src/services/error-formatter.js';
import { DefinitionIssueError, RefDeleteError } from '#src/utils/error.js';

import { useProjectDefinitionContainer } from './hooks/use-project-definition-container.js';
import { useRemoteProjectDefinitionContents } from './hooks/use-remote-project-definition-contents.js';
import { useSchemaParserContext } from './hooks/use-schema-parser-context.js';
import { NewProjectCard } from './new-project-card.js';

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
        const rawProjectDefinition = produce(definition, newConfig);

        const pluginStore = createPluginSpecStore(
          parserContext.pluginStore,
          rawProjectDefinition,
        );

        const schemaCreatorOptions = { plugins: pluginStore };

        // Apply auto-fixes from registered validators (e.g. clearing disabled services)
        const defContext =
          createDefinitionSchemaParserContext(schemaCreatorOptions);
        const defSchema = createProjectDefinitionSchema(defContext);
        const newProjectDefinition = applyDefinitionFixes(
          defSchema,
          rawProjectDefinition,
        );

        // Collect and check definition issues
        const issues = collectDefinitionIssues(
          defSchema,
          newProjectDefinition,
          pluginStore,
        );
        const { errors } = partitionIssuesBySeverity(issues);

        // Block save on errors
        if (errors.length > 0) {
          throw new DefinitionIssueError(errors);
        }

        const result = fixRefDeletions(
          createProjectDefinitionSchema,
          newProjectDefinition,
          schemaCreatorOptions,
        );
        if (result.type === 'failure') {
          throw new RefDeleteError(result.issues);
        }

        const fixedProjectDefinition = result.value;

        fixedProjectDefinition.cliVersion = cliVersion;

        const definitionContainer = new ProjectDefinitionContainer(
          result.refPayload,
          parserContext,
          pluginStore,
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
          if (err instanceof DefinitionIssueError) {
            for (const issue of err.issues) {
              toast.error(issue.message);
            }
          } else if (
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
      pluginContainer: projectDefinitionContainer.pluginStore,
      schemaParserContext,
      updatedExternally,
      definitionSchemaParserContext: createDefinitionSchemaParserContext({
        plugins: projectDefinitionContainer.pluginStore,
      }),
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

  const previousDefinition = useRef<ProjectDefinition>(result?.definition);
  useEffect(() => {
    if (!result?.definition) return;
    if (previousDefinition.current !== result.definition) {
      // Invalidate the router cache when we update the project definition
      router.invalidate().catch(logAndFormatError);
    }
    previousDefinition.current = result.definition;
  }, [result?.definition]);

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
              definition.settings.general = {
                ...data,
                packageScope: '',
              };
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
