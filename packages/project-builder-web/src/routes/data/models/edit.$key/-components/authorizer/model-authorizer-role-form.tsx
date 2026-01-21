import type {
  AuthorizerRoleConfig,
  ModelConfig,
} from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  authConfigSpec,
  createAuthorizerRoleSchema,
  modelAuthorizerRoleEntityType,
} from '@baseplate-dev/project-builder-lib';
import {
  useDefinitionSchema,
  useProjectDefinition,
} from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  CodeEditorFieldController,
  DialogClose,
  DialogFooter,
  InputFieldController,
} from '@baseplate-dev/ui-components';
import { autocompletion } from '@codemirror/autocomplete';
import { linter } from '@codemirror/lint';
import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import { useId, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useEditedModelConfig } from '../../../-hooks/use-edited-model-config.js';
import { createAuthorizerCompletions } from './authorizer-expression-autocomplete.js';
import { createAuthorizerExpressionLinter } from './authorizer-expression-linter.js';

interface ModelAuthorizerRoleFormProps {
  className?: string;
  defaultValues?: AuthorizerRoleConfig;
  onSubmit: (role: AuthorizerRoleConfig) => void;
  onCancel: () => void;
}

export function ModelAuthorizerRoleForm({
  className,
  defaultValues,
  onSubmit,
  onCancel,
}: ModelAuthorizerRoleFormProps): React.JSX.Element {
  const roleSchema = useDefinitionSchema(createAuthorizerRoleSchema);
  const { definitionContainer } = useProjectDefinition();

  const schema = useMemo(
    () =>
      z.object({
        role: roleSchema,
      }),
    [roleSchema],
  );

  const formProps = useForm<{ role: AuthorizerRoleConfig }>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: defaultValues ?? {
        id: modelAuthorizerRoleEntityType.generateNewId(),
        name: '',
        expression: '',
      },
    },
  });

  const {
    handleSubmit,
    control,
    formState: { isDirty },
  } = formProps;

  const isCreate = !defaultValues;

  const handleFormSubmit = handleSubmit((data) => {
    onSubmit({
      ...data.role,
      id: data.role.id || modelAuthorizerRoleEntityType.generateNewId(),
    });
  });

  const formId = useId();

  // Get current model config for autocomplete
  const modelConfig = useEditedModelConfig((model) => model);

  // Get model context for linter
  const modelContext = useMemo(
    () => ({
      modelName: modelConfig.name,
      scalarFieldNames: new Set<string>(
        modelConfig.model.fields.map((field: { name: string }) => field.name),
      ),
    }),
    [modelConfig],
  );

  // Get project roles from auth config
  const projectRoles = useMemo(() => {
    const authConfig = definitionContainer.pluginStore.use(authConfigSpec);
    const roles = authConfig.getAuthConfig(
      definitionContainer.definition,
    )?.roles;
    return roles?.map((role) => role.name) ?? [];
  }, [definitionContainer]);

  // Create CodeMirror extensions
  const extensions = useMemo(() => {
    const exts = [
      autocompletion({
        override: [
          createAuthorizerCompletions(modelConfig as ModelConfig, projectRoles),
        ],
      }),
      linter(
        createAuthorizerExpressionLinter(modelContext, definitionContainer),
      ),
    ];

    return exts;
  }, [modelConfig, projectRoles, modelContext, definitionContainer]);

  return (
    <form
      className={clsx('space-y-4', className)}
      id={formId}
      onSubmit={(e) => {
        e.stopPropagation();
        return handleFormSubmit(e);
      }}
    >
      <InputFieldController
        control={control}
        name="role.name"
        label="Role Name"
        placeholder="owner"
        description='A camelCase identifier for this role (e.g., "owner", "viewer")'
      />
      <CodeEditorFieldController
        control={control}
        name="role.expression"
        label="Expression"
        placeholder="model.id === userId"
        language="javascript"
        extensions={extensions}
        height="120px"
        description={
          <>
            TypeScript boolean expression. Available: <code>model</code> (the
            model instance), <code>userId</code>, <code>hasRole()</code>, and{' '}
            <code>hasSomeRole()</code>
          </>
        }
      />
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={!isCreate && !isDirty} form={formId}>
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}
