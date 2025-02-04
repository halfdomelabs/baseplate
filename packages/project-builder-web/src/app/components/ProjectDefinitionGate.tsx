import type { ProjectDefinition } from '@halfdomelabs/project-builder-lib';
import type {
  SetOrTransformConfig,
  SetProjectDefinitionOptions,
  UseProjectDefinitionResult,
} from '@halfdomelabs/project-builder-lib/web';
import type React from 'react';

import {
  createPluginImplementationStore,
  createProjectDefinitionSchemaWithContext,
  fixRefDeletions,
  ParsedProjectDefinition,
  parseProjectDefinitionWithContext,
  prettyStableStringify,
  ProjectDefinitionContainer,
  runSchemaMigrations,
  serializeSchema,
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
import { useClientVersion } from 'src/hooks/useClientVersion';
import { useProjects } from 'src/hooks/useProjects';
import { useRemoteProjectDefinition } from 'src/hooks/useRemoteProjectDefinition';
import { formatError } from 'src/services/error-formatter';
import { logError } from 'src/services/error-logger';
import { logger } from 'src/services/logger';
import {
  formatZodError,
  RefDeleteError,
  UserVisibleError,
} from 'src/utils/error';
import { ZodError } from 'zod';

import { NewProjectCard } from './NewProjectCard';

interface ProjectDefinitionGateProps {
  children?: React.ReactNode;
}

export function ProjectDefinitionGate({
  children,
}: ProjectDefinitionGateProps): React.JSX.Element {
  const {
    value: remoteConfig,
    loaded,
    error,
    saveValue: saveRemoteConfig,
    projectId,
    externalChangeCounter,
    downloadConfig,
    schemaParserContext,
    lastModifiedAt,
  } = useRemoteProjectDefinition();
  const { projects, resetCurrentProjectId } = useProjects();
  const { version: cliVersion } = useClientVersion();

  const selectedProject = projects.find((p) => p.id === projectId);

  const [savedConfig, setSavedConfig] = useState<{
    project: ParsedProjectDefinition;
    definitionContainer: ProjectDefinitionContainer;
    externalChangeCounter: number;
    projectId: string;
  } | null>(null);

  const loadData = useMemo(():
    | {
        status: 'loaded';
        parsedProject: ParsedProjectDefinition;
        definitionContainer: ProjectDefinitionContainer;
      }
    | { status: 'error'; configError: unknown }
    | { status: 'loading' } => {
    if (!remoteConfig || !projectId || !loaded || !schemaParserContext) {
      return { status: 'loading' };
    }
    if (
      externalChangeCounter === savedConfig?.externalChangeCounter &&
      projectId === savedConfig.projectId
    ) {
      return {
        status: 'loaded',
        parsedProject: savedConfig.project,
        definitionContainer: savedConfig.definitionContainer,
      };
    }
    try {
      const projectDefinition = JSON.parse(remoteConfig) as ProjectDefinition;
      // migrate config
      const { newConfig: migratedProjectDefinition, appliedMigrations } =
        runSchemaMigrations(projectDefinition);
      if (appliedMigrations.length > 0) {
        logger.log(
          `Applied migrations:\n${appliedMigrations
            .map((m) => `${m.version}: ${m.description}`)
            .join('\n')}`,
        );
      }
      // validate config
      const definitionContainer =
        ProjectDefinitionContainer.fromSerializedConfig(
          migratedProjectDefinition,
          schemaParserContext,
        );
      const project = new ParsedProjectDefinition(definitionContainer);
      // only save config if project is initialized
      if (projectDefinition.isInitialized) {
        setSavedConfig({
          project,
          externalChangeCounter,
          projectId,
          definitionContainer,
        });
      }
      return { status: 'loaded', parsedProject: project, definitionContainer };
    } catch (error_) {
      if (error_ instanceof SyntaxError) {
        return {
          status: 'error',
          configError: new UserVisibleError(
            'The project configuration is not a valid JSON file. Please check the file and try again.',
          ),
        };
      }
      if (error_ instanceof ZodError) {
        return {
          status: 'error',
          configError: new UserVisibleError(
            `The project configuration is not valid: ${formatZodError(error_)}`,
          ),
        };
      }
      logError(error_);
      return { status: 'error', configError: error_ };
    }
  }, [
    savedConfig,
    remoteConfig,
    externalChangeCounter,
    projectId,
    loaded,
    schemaParserContext,
  ]);

  const result: UseProjectDefinitionResult | undefined = useMemo(() => {
    if (loadData.status !== 'loaded' || !projectId || !schemaParserContext) {
      return;
    }
    function setConfig(
      newConfig: SetOrTransformConfig,
      { fixReferences }: SetProjectDefinitionOptions = {},
    ): void {
      if (loadData.status !== 'loaded' || !projectId || !schemaParserContext) {
        throw new Error(
          'Cannot set config when project config is not yet loaded',
        );
      }

      const oldProjectDefinition = loadData.definitionContainer.definition;
      const newProjectDefinition =
        typeof newConfig === 'function'
          ? produce(oldProjectDefinition, newConfig)
          : newConfig;

      const projectDefinitionSchemaWithContext =
        createProjectDefinitionSchemaWithContext(
          newProjectDefinition,
          schemaParserContext,
        );

      let validatedProjectDefinition = parseProjectDefinitionWithContext(
        newProjectDefinition,
        schemaParserContext,
      );

      if (fixReferences) {
        const result = fixRefDeletions(
          projectDefinitionSchemaWithContext,
          validatedProjectDefinition,
        );
        if (result.type === 'failure') {
          throw new RefDeleteError(result.issues);
        }
        validatedProjectDefinition = result.value;
      }

      const parsedConfig = new ParsedProjectDefinition(
        ProjectDefinitionContainer.fromDefinition(
          validatedProjectDefinition,
          schemaParserContext,
        ),
      );
      parsedConfig.projectDefinition.cliVersion = cliVersion;

      const exportedProjectDefinition =
        parsedConfig.exportToProjectDefinition();
      const definitionContainer = ProjectDefinitionContainer.fromDefinition(
        exportedProjectDefinition,
        schemaParserContext,
      );

      saveRemoteConfig(
        prettyStableStringify(definitionContainer.toSerializedConfig()),
      );
      setSavedConfig({
        project: parsedConfig,
        externalChangeCounter,
        projectId,
        definitionContainer,
      });
    }

    const pluginContainer = createPluginImplementationStore(
      schemaParserContext.pluginStore,
      loadData.definitionContainer.definition,
    );

    return {
      definition: loadData.definitionContainer.definition,
      parsedProject: loadData.parsedProject,
      definitionContainer: loadData.definitionContainer,
      externalChangeCounter,
      setConfigAndFixReferences: (config) => {
        setConfig(config, { fixReferences: true });
      },
      setConfig,
      pluginContainer,
      schemaParserContext,
      lastModifiedAt,
    };
  }, [
    loadData,
    saveRemoteConfig,
    cliVersion,
    externalChangeCounter,
    projectId,
    schemaParserContext,
    lastModifiedAt,
  ]);

  const compositeError =
    error ?? (loadData.status === 'error' ? loadData.configError : undefined);

  if (!loaded || compositeError || !result) {
    return (
      <ErrorableLoader
        error={
          compositeError &&
          formatError(
            compositeError,
            `We could not load the project config (${
              selectedProject?.directory ?? 'unknown'
            }).`,
          )
        }
        header="Failed to load project config"
        actions={
          <div className="flex flex-col space-y-4">
            <Button
              onClick={() =>
                downloadConfig().catch((err: unknown) => {
                  logError(err);
                })
              }
            >
              Try Again
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
      />
    );
  }

  if (!result.definition.isInitialized) {
    return (
      <div className="flex h-full items-center justify-center">
        <NewProjectCard
          existingProject={result.parsedProject.projectDefinition}
          saveProject={(data) => {
            if (!schemaParserContext) {
              return;
            }
            const oldProjectDefinition =
              result.parsedProject.exportToProjectDefinition();
            const newProjectDefinition = {
              ...oldProjectDefinition,
              ...data,
              isInitialized: true,
            };
            const projectDefinitionSchemaWithContext =
              createProjectDefinitionSchemaWithContext(
                newProjectDefinition,
                schemaParserContext,
              );
            saveRemoteConfig(
              prettyStableStringify(
                serializeSchema(
                  projectDefinitionSchemaWithContext,
                  newProjectDefinition as ProjectDefinition,
                ),
              ),
              undefined,
              () => {
                toast.success('Successfully created project!');
              },
            );
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
