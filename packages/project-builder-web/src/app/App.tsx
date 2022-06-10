import {
  ProjectConfig,
  projectConfigSchema,
  getProjectConfigReferences,
  fixReferenceRenames,
  ParsedProjectConfig,
} from '@baseplate/project-builder-lib';
import produce from 'immer';
import { useMemo, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import { useLocalStorage } from 'src/hooks/useLocalStorage';
import {
  ProjectConfigContext,
  UseProjectConfigResult,
} from 'src/hooks/useProjectConfig';
import { useToast } from 'src/hooks/useToast';
import { formatError } from 'src/services/error-formatter';
import PagesRoot from '../pages';

function App(): JSX.Element {
  const [savedConfig, setSavedConfig] = useLocalStorage('saved-app-config');
  const toast = useToast();
  const initialConfig = useMemo(() => {
    if (savedConfig) {
      try {
        const projectConfig = JSON.parse(savedConfig) as ProjectConfig;
        // validate config
        const validatedConfig = projectConfigSchema.parse(projectConfig);
        return new ParsedProjectConfig(validatedConfig);
      } catch (err) {
        toast.error(`Could not parse stored config: ${formatError(err)}`);
      }
    }
    return new ParsedProjectConfig({
      name: 'test-app',
      version: '0.1.0',
      portBase: 4000,
      apps: [],
      features: [],
      models: [],
    });
  }, [savedConfig, toast]);

  const [parsedProject, setParsedApp] =
    useState<ParsedProjectConfig>(initialConfig);

  const result: UseProjectConfigResult = useMemo(
    () => ({
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
        console.log(fixedProjectConfig);
        const validatedProjectConfig =
          projectConfigSchema.parse(fixedProjectConfig);
        const parsedConfig = new ParsedProjectConfig(validatedProjectConfig);
        setParsedApp(parsedConfig);
        const exportedProjectConfig = parsedConfig.exportToProjectConfig();
        setSavedConfig(JSON.stringify(exportedProjectConfig));
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
        setParsedApp(parsedConfig);
        const exportedProjectConfig = parsedConfig.exportToProjectConfig();
        setSavedConfig(JSON.stringify(exportedProjectConfig));
      },
    }),
    [parsedProject, setSavedConfig]
  );

  return (
    <BrowserRouter>
      <ProjectConfigContext.Provider value={result}>
        <PagesRoot />
        <Toaster />
      </ProjectConfigContext.Provider>
    </BrowserRouter>
  );
}

export default App;
