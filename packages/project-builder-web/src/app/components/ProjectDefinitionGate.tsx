import {
  ParsedProjectDefinition,
  ProjectDefinition,
  ProjectDefinitionContainer,
  fixRefDeletions,
  projectDefinitionSchema,
  runSchemaMigrations,
  serializeSchema,
} from '@halfdomelabs/project-builder-lib';
import {
  Button,
  ErrorDisplay,
  ErrorableLoader,
} from '@halfdomelabs/ui-components';
import { produce } from 'immer';
import { useEffect, useMemo, useRef } from 'react';
import semver from 'semver';
import { ZodError } from 'zod';

import { NewProjectCard } from './NewProjectCard';
import { websocketEvents } from '@src/services/api';
import { useClientVersion } from 'src/hooks/useClientVersion';
import {
  ProjectDefinitionContext,
  SetOrTransformConfig,
  SetProjectDefinitionOptions,
  UseProjectDefinitionResult,
} from 'src/hooks/useProjectDefinition';
import { useProjects } from 'src/hooks/useProjects';
import { useRemoteProjectDefinition } from 'src/hooks/useRemoteProjectDefinition';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';
import { logError } from 'src/services/error-logger';
import { logger } from 'src/services/logger';
import {
  RefDeleteError,
  UserVisibleError,
  formatZodError,
} from 'src/utils/error';
import { prettyStableStringify } from 'src/utils/json';

interface ProjectDefinitionGateProps {
  children?: React.ReactNode;
}

export function ProjectDefinitionGate({
  children,
}: ProjectDefinitionGateProps): JSX.Element {
  const {
    value: remoteConfig,
    loaded,
    error,
    saveValue: saveRemoteConfig,
    projectId,
    externalChangeCounter,
    downloadConfig,
  } = useRemoteProjectDefinition();
  const { projects, resetCurrentProjectId } = useProjects();
  const { version: cliVersion, refreshVersion } = useClientVersion();
  const toast = useToast();

  const selectedProject = projects.find((p) => p.id === projectId);

  // refresh version when we reconnect to websocket client
  useEffect(
    () =>
      websocketEvents.on('open', () => {
        refreshVersion().catch((err) => logError(err));
      }),
    [refreshVersion],
  );

  const savedConfigRef = useRef<{
    project: ParsedProjectDefinition;
    definitionContainer: ProjectDefinitionContainer;
    externalChangeCounter: number;
    projectId: string;
  }>();

  const loadData = useMemo(():
    | {
        status: 'loaded';
        parsedProject: ParsedProjectDefinition;
        definitionContainer: ProjectDefinitionContainer;
      }
    | { status: 'error'; configError: unknown }
    | { status: 'loading' } => {
    if (!remoteConfig || !projectId || !loaded) {
      return { status: 'loading' };
    }
    if (
      externalChangeCounter === savedConfigRef.current?.externalChangeCounter &&
      projectId === savedConfigRef.current?.projectId
    ) {
      return {
        status: 'loaded',
        parsedProject: savedConfigRef.current.project,
        definitionContainer: savedConfigRef.current.definitionContainer,
      };
    }
    try {
      const projectDefinition = JSON.parse(remoteConfig) as ProjectDefinition;
      // migrate config
      const { newConfig: migratedProjectDefinition, appliedMigrations } =
        runSchemaMigrations(projectDefinition);
      if (appliedMigrations.length) {
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
        );
      const project = new ParsedProjectDefinition(definitionContainer);
      // only save config if project is initialized
      if (projectDefinition.isInitialized) {
        savedConfigRef.current = {
          project,
          externalChangeCounter,
          projectId,
          definitionContainer,
        };
      }
      return { status: 'loaded', parsedProject: project, definitionContainer };
    } catch (err) {
      if (err instanceof SyntaxError) {
        return {
          status: 'error',
          configError: new UserVisibleError(
            'The project configuration is not a valid JSON file. Please check the file and try again.',
          ),
        };
      }
      if (err instanceof ZodError) {
        return {
          status: 'error',
          configError: new UserVisibleError(
            `The project configuration is not valid: ${formatZodError(err)}`,
          ),
        };
      }
      logError(err);
      return { status: 'error', configError: err };
    }
  }, [remoteConfig, externalChangeCounter, projectId, loaded]);

  const result: UseProjectDefinitionResult | undefined = useMemo(() => {
    if (loadData.status !== 'loaded' || !projectId) {
      return undefined;
    }
    function setConfig(
      newConfig: SetOrTransformConfig,
      { fixReferences }: SetProjectDefinitionOptions = {},
    ): void {
      if (loadData.status !== 'loaded' || !projectId) {
        throw new Error(
          'Cannot set config when project config is not yet loaded',
        );
      }

      const oldProjectDefinition = loadData.definitionContainer.definition;
      const newProjectDefinition =
        typeof newConfig === 'function'
          ? produce(oldProjectDefinition, newConfig)
          : newConfig;

      let validatedProjectDefinition =
        projectDefinitionSchema.parse(newProjectDefinition);

      if (fixReferences) {
        const result = fixRefDeletions(
          projectDefinitionSchema,
          validatedProjectDefinition,
        );
        if (result.type === 'failure') {
          throw new RefDeleteError(result.issues);
        }
        validatedProjectDefinition = result.value;
      }

      const parsedConfig = new ParsedProjectDefinition(
        ProjectDefinitionContainer.fromConfig(validatedProjectDefinition),
      );
      parsedConfig.projectDefinition.cliVersion = cliVersion;

      const exportedProjectDefinition =
        parsedConfig.exportToProjectDefinition();
      const definitionContainer = ProjectDefinitionContainer.fromConfig(
        exportedProjectDefinition,
      );

      saveRemoteConfig(
        prettyStableStringify(definitionContainer.toSerializedConfig()),
      );
      savedConfigRef.current = {
        project: parsedConfig,
        externalChangeCounter,
        projectId,
        definitionContainer,
      };
    }
    return {
      config: loadData.definitionContainer.definition,
      parsedProject: loadData.parsedProject,
      definitionContainer: loadData.definitionContainer,
      externalChangeCounter,
      setConfigAndFixReferences: (config) => {
        setConfig(config, { fixReferences: true });
      },
      setConfig,
    };
  }, [
    loadData,
    saveRemoteConfig,
    cliVersion,
    externalChangeCounter,
    projectId,
  ]);

  const compositeError =
    error ?? (loadData.status === 'error' ? loadData.configError : undefined);
  if (!loaded || compositeError) {
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
              onClick={() => downloadConfig().catch((err) => logError(err))}
            >
              Try Again
            </Button>
            {projects.length > 1 && (
              <Button
                variant="secondary"
                onClick={() => resetCurrentProjectId()}
              >
                Switch Project
              </Button>
            )}
          </div>
        }
      />
    );
  }

  if (!result?.parsedProject.projectDefinition.isInitialized) {
    return (
      <div className="flex h-full items-center justify-center">
        <NewProjectCard
          existingProject={result?.parsedProject.projectDefinition}
          saveProject={(data) => {
            const oldProjectDefinition =
              result?.parsedProject.exportToProjectDefinition() ?? {};
            const newProjectDefinition = {
              ...oldProjectDefinition,
              ...data,
              isInitialized: true,
            };
            saveRemoteConfig(
              prettyStableStringify(
                serializeSchema(
                  projectDefinitionSchema,
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
    result.config.cliVersion &&
    cliVersion &&
    cliVersion !== 'preview' &&
    semver.gt(result.config.cliVersion, cliVersion)
  ) {
    return (
      <ErrorDisplay
        header="Upgrade your Baseplate client"
        actions={
          <div className="flex flex-col space-y-4">
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
            {projects.length > 1 && (
              <Button
                variant="secondary"
                onClick={() => resetCurrentProjectId()}
              >
                Switch Project
              </Button>
            )}
          </div>
        }
        error={
          <>
            This project requires a newer version of the client (
            {result.config.cliVersion}). Please upgrade your client by running{' '}
            <strong>pnpm install</strong>.
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
