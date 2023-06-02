import {
  fixReferenceRenames,
  getProjectConfigReferences,
  ParsedProjectConfig,
  ProjectConfig,
  projectConfigSchema,
} from '@halfdomelabs/project-builder-lib';
import { Button, ErrorableLoader } from '@halfdomelabs/ui-components';
import produce from 'immer';
import { useEffect, useMemo, useRef } from 'react';
import semver from 'semver';
import { ZodError } from 'zod';
import { Alert } from 'src/components';
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
import { WebsocketClientContext } from 'src/hooks/useWebsocketClient';
import { formatError } from 'src/services/error-formatter';
import { logError } from 'src/services/error-logger';
import { formatZodError, UserVisibleError } from 'src/utils/error';
import { prettyStableStringify } from 'src/utils/json';
import { NewProjectCard } from './NewProjectCard';

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
    websocketClient,
    projectId,
    externalChangeCounter,
  } = useRemoteProjectConfig();
  const { projects } = useProjects();
  const [, setProjectId] = useProjectIdState();
  const { version: cliVersion, refreshVersion } = useClientVersion();
  const toast = useToast();

  const selectedProject = projects.find((p) => p.id === projectId);

  // refresh version when we reconnect to websocket client
  useEffect(
    () =>
      websocketClient?.on('connected', () => {
        refreshVersion().catch((err) => logError(err));
      }),
    [websocketClient, refreshVersion]
  );

  const savedConfigRef = useRef<{
    project: ParsedProjectConfig;
    externalChangeCounter: number;
    projectId: string;
  }>();

  const { parsedProject, configError } = useMemo((): {
    parsedProject?: ParsedProjectConfig;
    configError?: unknown;
  } => {
    if (!remoteConfig || !projectId || !loaded) {
      return {};
    }
    if (
      externalChangeCounter === savedConfigRef.current?.externalChangeCounter &&
      projectId === savedConfigRef.current?.projectId
    ) {
      return { parsedProject: savedConfigRef.current.project };
    }
    try {
      const projectConfig = JSON.parse(remoteConfig) as ProjectConfig;
      // validate config
      const validatedConfig = projectConfigSchema.parse(projectConfig);
      const project = new ParsedProjectConfig(validatedConfig);
      // only save config if project is initialized
      if (projectConfig.isInitialized) {
        savedConfigRef.current = {
          project,
          externalChangeCounter,
          projectId,
        };
      }
      return { parsedProject: project };
    } catch (err) {
      if (err instanceof SyntaxError) {
        return {
          configError: new UserVisibleError(
            'The project configuration is not a valid JSON file. Please check the file and try again.'
          ),
        };
      }
      if (err instanceof ZodError) {
        return {
          configError: new UserVisibleError(
            `The project configuration is not valid: ${formatZodError(err)}`
          ),
        };
      }
      logError(err);
      return { configError: err };
    }
  }, [remoteConfig, externalChangeCounter, projectId, loaded]);

  const result: UseProjectConfigResult | undefined = useMemo(() => {
    if (!parsedProject || !projectId) {
      return undefined;
    }
    function setConfig(
      newConfig: SetOrTransformConfig,
      { fixReferences }: SetProjectConfigOptions = {}
    ): void {
      if (!parsedProject || !projectId) {
        throw new Error(
          'Cannot set config when project config is not yet loaded'
        );
      }
      const oldProjectConfig = parsedProject.exportToProjectConfig();
      let newProjectConfig =
        typeof newConfig === 'function'
          ? produce(oldProjectConfig, newConfig)
          : newConfig;

      // TODO: Figure out better validation technique as we're validating twice
      const validatedProjectConfig =
        projectConfigSchema.parse(newProjectConfig);

      if (fixReferences) {
        newProjectConfig = fixReferenceRenames(
          oldProjectConfig,
          validatedProjectConfig,
          getProjectConfigReferences,
          typeof fixReferences === 'boolean' ? undefined : fixReferences
        );
      }

      const parsedConfig = new ParsedProjectConfig(validatedProjectConfig);
      parsedConfig.projectConfig.cliVersion = cliVersion;

      const exportedProjectConfig = parsedConfig.exportToProjectConfig();

      saveRemoteConfig(prettyStableStringify(exportedProjectConfig));
      savedConfigRef.current = {
        project: parsedConfig,
        externalChangeCounter,
        projectId,
      };
    }
    return {
      config: parsedProject.exportToProjectConfig(),
      parsedProject,
      externalChangeCounter,
      setConfigAndFixReferences: (config, options) => {
        setConfig(config, { fixReferences: options || true });
      },
      setConfig,
    };
  }, [
    parsedProject,
    saveRemoteConfig,
    cliVersion,
    externalChangeCounter,
    projectId,
  ]);

  const websocketClientResult = useMemo(
    () => ({ websocketClient }),
    [websocketClient]
  );

  const compositeError = error || configError;
  if (!loaded || compositeError) {
    return (
      <ErrorableLoader
        error={
          compositeError &&
          formatError(
            compositeError,
            `We could not load the project config (${
              selectedProject?.directory || 'unknown'
            }).`
          )
        }
        header="Failed to load project config"
        actions={
          projects.length > 1 && (
            <Button onClick={() => setProjectId(null)}>Switch Project</Button>
          )
        }
      />
    );
  }

  if (!result || !result.parsedProject.projectConfig.isInitialized) {
    return (
      <div className="flex h-full items-center justify-center">
        <NewProjectCard
          existingProjectName={result?.parsedProject.projectConfig.name}
          saveProject={(projectConfig) =>
            saveRemoteConfig(
              prettyStableStringify(projectConfig),
              undefined,
              () => {
                toast.success('Successfully created project!');
              }
            )
          }
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
      <div className="mt-16 flex flex-col items-center justify-center space-y-4">
        <Alert type="error">
          This project requires a newer version of the client (
          {result.config.cliVersion}). Please run upgrade your client e.g. by
          running yarn install.
        </Alert>
        {projects.length > 0 && (
          <Button onClick={() => setProjectId(null)}>Switch Project</Button>
        )}
      </div>
    );
  }

  return (
    <WebsocketClientContext.Provider value={websocketClientResult}>
      <ProjectConfigContext.Provider value={result}>
        {children}
      </ProjectConfigContext.Provider>
    </WebsocketClientContext.Provider>
  );
}
