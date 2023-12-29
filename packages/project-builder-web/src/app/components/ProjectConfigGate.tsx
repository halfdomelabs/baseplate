import {
  ParsedProjectConfig,
  ProjectConfig,
  ProjectDefinitionContainer,
  fixRefDeletions,
  fixReferenceRenames,
  getProjectConfigReferences,
  projectConfigSchema,
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
  ProjectConfigContext,
  SetOrTransformConfig,
  SetProjectConfigOptions,
  UseProjectConfigResult,
} from 'src/hooks/useProjectConfig';
import { useProjectIdState } from 'src/hooks/useProjectIdState';
import { useProjects } from 'src/hooks/useProjects';
import { useRemoteProjectConfig } from 'src/hooks/useRemoteProjectConfig';
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

interface ProjectConfigGateProps {
  children?: React.ReactNode;
}

export function ProjectConfigGate({
  children,
}: ProjectConfigGateProps): JSX.Element {
  const {
    value: remoteConfig,
    loaded,
    error,
    saveValue: saveRemoteConfig,
    projectId,
    externalChangeCounter,
    downloadConfig,
  } = useRemoteProjectConfig();
  const { projects } = useProjects();
  const [, setProjectId] = useProjectIdState();
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
    project: ParsedProjectConfig;
    definitionContainer: ProjectDefinitionContainer;
    externalChangeCounter: number;
    projectId: string;
  }>();

  const loadData = useMemo(():
    | {
        status: 'loaded';
        parsedProject: ParsedProjectConfig;
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
      const projectConfig = JSON.parse(remoteConfig) as ProjectConfig;
      // migrate config
      const { newConfig: migratedProjectConfig, appliedMigrations } =
        runSchemaMigrations(projectConfig);
      if (appliedMigrations.length) {
        logger.log(
          `Applied migrations:\n${appliedMigrations
            .map((m) => `${m.version}: ${m.description}`)
            .join('\n')}`,
        );
      }
      // validate config
      const definitionContainer =
        ProjectDefinitionContainer.fromSerializedConfig(migratedProjectConfig);
      const project = new ParsedProjectConfig(definitionContainer);
      // only save config if project is initialized
      if (projectConfig.isInitialized) {
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

  const result: UseProjectConfigResult | undefined = useMemo(() => {
    if (loadData.status !== 'loaded' || !projectId) {
      return undefined;
    }
    function setConfig(
      newConfig: SetOrTransformConfig,
      { fixReferences }: SetProjectConfigOptions = {},
    ): void {
      if (loadData.status !== 'loaded' || !projectId) {
        throw new Error(
          'Cannot set config when project config is not yet loaded',
        );
      }

      const oldProjectConfig = loadData.definitionContainer.definition;
      const newProjectConfig =
        typeof newConfig === 'function'
          ? produce(oldProjectConfig, newConfig)
          : newConfig;

      // TODO: Figure out better validation technique as we're validating twice
      let validatedProjectConfig = projectConfigSchema.parse(newProjectConfig);

      if (fixReferences) {
        validatedProjectConfig = fixReferenceRenames(
          oldProjectConfig,
          validatedProjectConfig,
          getProjectConfigReferences,
          typeof fixReferences === 'boolean' ? undefined : fixReferences,
        );
        const result = fixRefDeletions(
          projectConfigSchema,
          validatedProjectConfig,
        );
        if (result.type === 'failure') {
          throw new RefDeleteError(result.issues);
        }
        validatedProjectConfig = result.value;
      }

      const parsedConfig = new ParsedProjectConfig(
        ProjectDefinitionContainer.fromConfig(validatedProjectConfig),
      );
      parsedConfig.projectConfig.cliVersion = cliVersion;

      const exportedProjectConfig = parsedConfig.exportToProjectConfig();
      const definitionContainer = ProjectDefinitionContainer.fromConfig(
        exportedProjectConfig,
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
      setConfigAndFixReferences: (config, options) => {
        setConfig(config, { fixReferences: options ?? true });
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
              <Button variant="secondary" onClick={() => setProjectId(null)}>
                Switch Project
              </Button>
            )}
          </div>
        }
      />
    );
  }

  if (!result || !result.parsedProject.projectConfig.isInitialized) {
    return (
      <div className="flex h-full items-center justify-center">
        <NewProjectCard
          existingProject={result?.parsedProject.projectConfig}
          saveProject={(data) => {
            const oldProjectConfig =
              result?.parsedProject.exportToProjectConfig() ?? {};
            const newProjectConfig = {
              ...oldProjectConfig,
              ...data,
              isInitialized: true,
            };
            saveRemoteConfig(
              prettyStableStringify(
                serializeSchema(
                  projectConfigSchema,
                  newProjectConfig as ProjectConfig,
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
              <Button variant="secondary" onClick={() => setProjectId(null)}>
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
    <ProjectConfigContext.Provider value={result}>
      {children}
    </ProjectConfigContext.Provider>
  );
}
