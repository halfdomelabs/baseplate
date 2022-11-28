import {
  fixReferenceRenames,
  getProjectConfigReferences,
  ParsedProjectConfig,
  ProjectConfig,
  projectConfigSchema,
} from '@baseplate/project-builder-lib';
import produce from 'immer';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ErrorableLoader } from 'src/components';
import {
  ProjectConfigContext,
  UseProjectConfigResult,
} from 'src/hooks/useProjectConfig';
import { useRemoteProjectConfig } from 'src/hooks/useRemoteProjectConfig';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';
import { prettyStableStringify } from 'src/utils/json';

interface Props {
  children?: React.ReactNode;
}

function ProjectConfigGate({ children }: Props): JSX.Element {
  const {
    value: remoteConfig,
    loaded,
    error,
    saveValue: saveRemoteConfig,
    externalChangeCounter,
  } = useRemoteProjectConfig();

  const [configError, setConfigError] = useState<Error | null>(null);

  const toast = useToast();

  const [parsedProject, setParsedProject] = useState<
    ParsedProjectConfig | null | undefined
  >(undefined);

  const oldExternalChangeCounter = useRef(-1);
  useEffect(() => {
    if (oldExternalChangeCounter.current === externalChangeCounter) {
      return;
    }
    if (!remoteConfig) {
      setParsedProject(null);
      return;
    }
    oldExternalChangeCounter.current = externalChangeCounter;
    try {
      const projectConfig = JSON.parse(remoteConfig) as ProjectConfig;
      // validate config
      const validatedConfig = projectConfigSchema.parse(projectConfig);
      setParsedProject(new ParsedProjectConfig(validatedConfig));
    } catch (err) {
      toast.error(`Could not parse stored config: ${formatError(err)}`);
      setConfigError(err as Error);
      setParsedProject(null);
    }
  }, [remoteConfig, externalChangeCounter, toast]);

  const result: UseProjectConfigResult | null | undefined = useMemo(
    () =>
      parsedProject && {
        config: parsedProject.exportToProjectConfig(),
        parsedProject,
        setConfigAndFixReferences: (transformer, options) => {
          // validate project config
          // TODO: Figure out better validation technique
          // get new project config
          const oldProjectConfig = parsedProject.exportToProjectConfig();
          const newProjectConfig = produce(oldProjectConfig, transformer);
          const fixedProjectConfig = fixReferenceRenames(
            oldProjectConfig,
            newProjectConfig,
            getProjectConfigReferences,
            options
          );
          const validatedProjectConfig =
            projectConfigSchema.parse(fixedProjectConfig);
          const parsedConfig = new ParsedProjectConfig(validatedProjectConfig);
          setParsedProject(parsedConfig);
          const exportedProjectConfig = parsedConfig.exportToProjectConfig();
          saveRemoteConfig(prettyStableStringify(exportedProjectConfig));
        },
        setConfig: (newConfig) => {
          // validate project config
          // TODO: Figure out better validation technique
          // get new project config
          const oldProjectConfig = parsedProject.exportToProjectConfig();
          const newProjectConfig =
            typeof newConfig === 'function'
              ? produce(oldProjectConfig, newConfig)
              : newConfig;
          const validatedProjectConfig =
            projectConfigSchema.parse(newProjectConfig);
          const parsedConfig = new ParsedProjectConfig(validatedProjectConfig);
          setParsedProject(parsedConfig);
          const exportedProjectConfig = parsedConfig.exportToProjectConfig();
          saveRemoteConfig(prettyStableStringify(exportedProjectConfig));
        },
      },
    [parsedProject, saveRemoteConfig]
  );

  if (!loaded || error || configError) {
    return (
      <div className="mt-16 flex items-center justify-center">
        <ErrorableLoader error={error || configError} />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="mt-16 flex items-center justify-center">
        <Alert type="error">No Project Config found!</Alert>
      </div>
    );
  }

  return (
    <ProjectConfigContext.Provider value={result}>
      {children}
    </ProjectConfigContext.Provider>
  );
}

export default ProjectConfigGate;
