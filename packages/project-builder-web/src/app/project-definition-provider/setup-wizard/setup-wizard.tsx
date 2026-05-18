import type {
  PluginMetadataWithPaths,
  ProjectDefinition,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import { Button, toast } from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { MdArrowForward } from 'react-icons/md';

import { useProjects } from '#src/hooks/use-projects.js';
import { IS_PREVIEW } from '#src/services/config.js';
import { logAndFormatError } from '#src/services/error-formatter.js';
import { trpc } from '#src/services/trpc.js';

import type {
  SetupWizardData,
  SetupWizardInput,
} from './setup-wizard-schema.js';

import { BasicsSection } from './sections/basics-section.js';
import { StackList } from './sections/stack-list.js';
import { setupWizardSchema } from './setup-wizard-schema.js';
import { useWizardSave } from './use-wizard-save.js';

interface SetupWizardProps {
  existingProject?: ProjectDefinition;
  definitionContainer: ProjectDefinitionContainer;
  saveDefinition: (
    setter: (draft: ProjectDefinition) => void,
  ) => Promise<unknown>;
}

const DEFAULT_VALUES: SetupWizardInput = {
  name: '',
  packageScope: '',
  portOffset: 3000,
  enableAuth: true,
  authMethod: 'local-auth',
  enableEmail: true,
  emailProvider: 'postmark',
  enableQueue: false,
  queueImplementation: 'pg-boss',
  enableStorage: false,
  enableObservability: true,
  enablePayments: false,
  enableAi: true,
};

export function SetupWizard({
  existingProject,
  definitionContainer,
  saveDefinition,
}: SetupWizardProps): React.ReactElement {
  const { currentProjectId } = useProjects();
  const [plugins, setPlugins] = useState<PluginMetadataWithPaths[] | null>(
    null,
  );
  useEffect(() => {
    setPlugins(null);
    if (!currentProjectId || IS_PREVIEW) {
      setPlugins([]);
      return;
    }
    trpc.plugins.getAvailablePlugins
      .mutate({ projectId: currentProjectId })
      .then(setPlugins)
      .catch((err: unknown) => {
        setPlugins([]);
        toast.error(
          logAndFormatError(
            err,
            'Failed to load plugins. You can still create a project with basic settings.',
          ),
        );
      });
  }, [currentProjectId]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<SetupWizardInput, unknown, SetupWizardData>({
    defaultValues: {
      ...DEFAULT_VALUES,
      name: existingProject?.settings.general.name ?? DEFAULT_VALUES.name,
      packageScope:
        existingProject?.settings.general.packageScope ??
        DEFAULT_VALUES.packageScope,
      portOffset:
        existingProject?.settings.general.portOffset ??
        DEFAULT_VALUES.portOffset,
    },
    resolver: zodResolver(setupWizardSchema),
  });

  const values = {
    enableAuth: watch('enableAuth') ?? false,
    authMethod: watch('authMethod') ?? 'local-auth',
    enableEmail: watch('enableEmail') ?? false,
    emailProvider: watch('emailProvider') ?? 'postmark',
    enableQueue: watch('enableQueue') ?? false,
    queueImplementation: watch('queueImplementation') ?? 'pg-boss',
    enableStorage: watch('enableStorage') ?? false,
    enableObservability: watch('enableObservability') ?? false,
    enablePayments: watch('enablePayments') ?? false,
    enableAi: watch('enableAi') ?? false,
  };

  const { saveWithPlugins, saveBasicsOnly } = useWizardSave({
    plugins: plugins ?? [],
    definitionContainer,
    saveDefinition,
  });

  const onCreateProject = handleSubmit((data) =>
    saveWithPlugins(data).catch((err: unknown) => {
      toast.error(logAndFormatError(err, 'Failed to create project'));
    }),
  );

  const onCreateBasicsOnly = handleSubmit(
    (data) =>
      saveBasicsOnly(data).catch((err: unknown) => {
        toast.error(logAndFormatError(err, 'Failed to create project'));
      }),
    // On validation error for plugin fields, still allow basics-only save.
    () => {
      const name = watch('name');
      const portOffset = watch('portOffset');
      void saveBasicsOnly({
        ...DEFAULT_VALUES,
        name,
        portOffset,
        enableAuth: false,
        enableEmail: false,
        enableObservability: false,
        enableAi: false,
      } as SetupWizardData).catch((err: unknown) => {
        toast.error(logAndFormatError(err, 'Failed to create project'));
      });
    },
  );

  const hasPlugins = plugins !== null && plugins.length > 0;

  return (
    <form
      onSubmit={onCreateProject}
      className="flex h-full flex-1 flex-col overflow-hidden bg-background"
    >
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl animate-in space-y-10 px-6 py-12 fade-in">
          <div className="flex items-start gap-3">
            <img
              className="size-8"
              src="/images/logo.png"
              alt="Baseplate Logo"
            />
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Create a new project
              </h1>
              <p className="text-sm text-muted-foreground">
                Configure your new Baseplate project. Change anything later in
                Settings.
              </p>
            </div>
          </div>

          <BasicsSection control={control} />

          {hasPlugins ? (
            <StackList setValue={setValue} plugins={plugins} values={values} />
          ) : plugins === null ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">
                Loading plugins…
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex w-full max-w-2xl flex-col-reverse items-stretch gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            You can change every choice later in Settings → Plugins
          </p>
          <div className="flex items-center gap-3">
            {hasPlugins ? (
              <Button
                type="button"
                variant="ghost"
                disabled={isSubmitting}
                onClick={onCreateBasicsOnly}
              >
                Just the basics
              </Button>
            ) : null}
            <Button type="submit" disabled={isSubmitting}>
              {hasPlugins ? 'Create project' : 'Initialize project'}
              <MdArrowForward className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
