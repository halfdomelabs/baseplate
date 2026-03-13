import type { AuthorizerRoleConfig } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  authConfigSpec,
  AuthorizerExpressionParseError,
  buildRelationValidationInfo,
  createAuthorizerRoleSchema,
  createModelValidationContext,
  modelAuthorizerRoleEntityType,
  parseAuthorizerExpression,
} from '@baseplate-dev/project-builder-lib';
import {
  useDefinitionSchema,
  useProjectDefinition,
} from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  CodeEditorFieldController,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DialogClose,
  DialogFooter,
  InputFieldController,
} from '@baseplate-dev/ui-components';
import { autocompletion } from '@codemirror/autocomplete';
import { linter } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import { useId, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { MdChevronRight } from 'react-icons/md';
import { z } from 'zod';

import type { RelationAutocompleteInfo } from './authorizer-expression-autocomplete.js';

import { useOriginalModel } from '../../../-hooks/use-original-model.js';
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

  const schema = useMemo(() => {
    // Add parse validation to the role schema
    const enhancedRoleSchema = roleSchema.superRefine((role, ctx) => {
      // Skip validation if expression is empty (already validated by parser schema)
      if (!role.expression.trim()) {
        return;
      }

      try {
        // Parse the expression to validate syntax
        parseAuthorizerExpression(role.expression);
      } catch (error) {
        if (error instanceof AuthorizerExpressionParseError) {
          ctx.addIssue({
            code: 'custom',
            message: error.message,
            path: ['expression'],
          });
        } else {
          ctx.addIssue({
            code: 'custom',
            message: 'Invalid expression syntax',
            path: ['expression'],
          });
        }
      }
    });

    return z.object({
      role: enhancedRoleSchema,
    });
  }, [roleSchema]);

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
  const modelConfig = useOriginalModel();
  const { definition } = useProjectDefinition();

  // Build relation info for nested authorizer validation and autocomplete
  const { modelContext, relationInfoList } = useMemo(() => {
    const relationValidationInfo = buildRelationValidationInfo(
      modelConfig.model.relations,
      definition.models,
    );

    // Derive autocomplete info from validation info
    const relInfoList: RelationAutocompleteInfo[] = [
      ...relationValidationInfo.entries(),
    ].map(([relationName, info]) => ({
      relationName,
      foreignModelName: info.foreignModelName,
      foreignAuthorizerRoleNames: [...info.foreignAuthorizerRoleNames],
    }));

    const ctx = createModelValidationContext(modelConfig);

    return {
      modelContext: {
        ...ctx,
        relationInfo: relationValidationInfo,
      },
      relationInfoList: relInfoList,
    };
  }, [modelConfig, definition]);

  // Get project roles from auth config, excluding built-in roles like 'system'
  // which are not meaningful in authorizer expressions
  const projectRoles = useMemo(() => {
    const authConfig = definitionContainer.pluginStore.use(authConfigSpec);
    const roles = authConfig.getAuthConfig(
      definitionContainer.definition,
    )?.roles;
    return (
      roles?.filter((role) => !role.builtIn).map((role) => role.name) ?? []
    );
  }, [definitionContainer]);

  // Create CodeMirror extensions
  const extensions = useMemo(() => {
    const exts = [
      autocompletion({
        override: [
          createAuthorizerCompletions(
            modelConfig,
            projectRoles,
            relationInfoList,
          ),
        ],
      }),
      linter(
        createAuthorizerExpressionLinter(
          modelContext,
          definitionContainer.pluginStore,
          definitionContainer.definition,
        ),
      ),
      EditorView.lineWrapping,
    ];

    return exts;
  }, [
    modelConfig,
    projectRoles,
    modelContext,
    relationInfoList,
    definitionContainer,
  ]);

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
          <Collapsible>
            TypeScript boolean expression. Available: <code>model</code>,{' '}
            <code>userId</code>, <code>isAuthenticated</code>,{' '}
            <code>hasRole()</code>, <code>hasSomeRole()</code>
            <CollapsibleTrigger className="mt-1 flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground [&[data-state=open]>svg]:rotate-90">
              <MdChevronRight className="size-3.5 transition-transform" />
              Show examples
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              <div>
                <code>model.id === userId</code>
              </div>
              <div>
                <code>isAuthenticated</code>
                {' — '}check if user is authenticated
              </div>
              <div>
                <code>hasRole(&apos;admin&apos;)</code>
              </div>
              <div>
                <code>
                  model.authorId === userId || hasRole(&apos;admin&apos;)
                </code>
              </div>
              <div>
                <code>hasRole(model.todoList, &apos;owner&apos;)</code>
                {' — '}check role on related model
              </div>
            </CollapsibleContent>
          </Collapsible>
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
