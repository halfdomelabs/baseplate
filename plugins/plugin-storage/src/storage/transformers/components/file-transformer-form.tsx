import type { ModelTransformerWebFullFormProps } from '@baseplate-dev/project-builder-lib/web';
import type { Resolver } from 'react-hook-form';

import {
  createTransformerSchema,
  modelTransformerEntityType,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';
import {
  useDefinitionSchema,
  useProjectDefinition,
} from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  ComboboxFieldController,
  DialogClose,
  DialogFooter,
  SelectFieldController,
} from '@baseplate-dev/ui-components';
import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useId, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type {
  FileCategoryInput,
  StoragePluginDefinitionInput,
} from '#src/storage/core/schema/plugin-definition.js';

import { STORAGE_MODELS } from '#src/storage/constants/model-names.js';
import { FileCategoryFormFields } from '#src/storage/core/components/file-category-form-fields.js';
import { getSelectableRoleOptions } from '#src/storage/core/components/get-selectable-role-options.js';
import {
  createFileCategorySchema,
  fileCategoryEntityType,
} from '#src/storage/core/schema/plugin-definition.js';

import type { FileTransformerDefinition } from '../schema/file-transformer.schema.js';

import '#src/styles.css';

interface FileTransformerFormValues {
  transformer: FileTransformerDefinition;
  category: FileCategoryInput;
}

type CategoryMode = 'select' | 'create' | 'edit';

function createDefaultCategory(): FileCategoryInput {
  return {
    id: fileCategoryEntityType.generateNewId(),
    name: '',
    maxFileSizeMb: 20,
    authorize: { uploadRoles: [] },
    adapterRef: '',
  };
}

export function FileTransformerForm({
  transformer,
  onUpdate,
  isCreate,
  originalModel,
  pluginKey,
}: ModelTransformerWebFullFormProps): React.JSX.Element {
  const {
    definition,
    definitionContainer,
    pluginContainer,
    saveDefinitionWithFeedback,
  } = useProjectDefinition();

  const storageConfig = PluginUtils.configByKeyOrThrow(
    definition,
    pluginKey ?? '',
  ) as StoragePluginDefinitionInput;

  // Unified form for both transformer and category
  const transformerSchema = useDefinitionSchema(createTransformerSchema);
  const fileCategorySchema = useDefinitionSchema(createFileCategorySchema);
  const schema = useMemo(
    () =>
      z.object({
        transformer: transformerSchema,
        category: fileCategorySchema,
      }),
    [transformerSchema, fileCategorySchema],
  );
  const form = useForm<FileTransformerFormValues>({
    resolver: zodResolver(
      schema,
    ) as unknown as Resolver<FileTransformerFormValues>,
    defaultValues: {
      transformer: transformer as FileTransformerDefinition,
      category: createDefaultCategory(),
    },
  });
  const {
    formState: { isDirty },
  } = form;
  const lens = useLens({ control: form.control });

  const [categoryMode, setCategoryMode] = useState<CategoryMode>('select');
  const formId = useId();

  // Options
  const fileRelations =
    originalModel.model.relations?.filter(
      (relation) =>
        definitionContainer.nameFromId(relation.modelRef) ===
        STORAGE_MODELS.file,
    ) ?? [];

  const relationOptions = fileRelations.map((relation) => ({
    label: relation.name,
    value: relation.id,
  }));

  const fileCategories = useMemo(
    () => storageConfig.fileCategories ?? [],
    [storageConfig.fileCategories],
  );
  const categoryOptions = fileCategories.map((category) => ({
    label: category.name,
    value: category.id,
  }));

  const adapterOptions = storageConfig.s3Adapters.map((adapter) => ({
    label: adapter.name,
    value: adapter.id,
  }));

  const roleOptions = getSelectableRoleOptions(pluginContainer, definition);

  // Category mode handlers
  const handleStartCreate = useCallback((): void => {
    form.reset({
      ...form.getValues(),
      category: createDefaultCategory(),
    });
    setCategoryMode('create');
  }, [form]);

  const handleStartEdit = useCallback((): void => {
    const selectedCategoryId = form.getValues('transformer.categoryRef');
    const category = fileCategories.find((c) => c.id === selectedCategoryId);
    if (category) {
      form.reset({
        ...form.getValues(),
        category,
      });
      setCategoryMode('edit');
    }
  }, [form, fileCategories]);

  const handleCancelCategory = useCallback((): void => {
    setCategoryMode('select');
  }, []);

  // Submit handler
  const handleSave = useCallback(async (): Promise<void> => {
    // Validate transformer fields
    const isTransformerValid = await form.trigger('transformer');
    if (!isTransformerValid) {
      return;
    }

    // Validate category fields if creating/editing
    if (categoryMode !== 'select') {
      const isCategoryValid = await form.trigger('category');
      if (!isCategoryValid) {
        return;
      }
    }

    const { transformer: transformerData, category: categoryData } =
      form.getValues();

    // Save category if creating/editing
    if (categoryMode !== 'select') {
      const { success } = await saveDefinitionWithFeedback(
        (draftConfig) => {
          const config = PluginUtils.configByKeyOrThrow(
            draftConfig,
            pluginKey ?? '',
          ) as StoragePluginDefinitionInput;

          const categories = config.fileCategories ?? [];
          if (categoryMode === 'create') {
            categories.push(categoryData);
            config.fileCategories = categories;
          } else {
            const existingIdx = categories.findIndex(
              (c) => c.id === categoryData.id,
            );
            if (existingIdx !== -1) {
              categories[existingIdx] = categoryData;
              config.fileCategories = categories;
            }
          }
        },
        {
          successMessage:
            categoryMode === 'create'
              ? 'File category created!'
              : 'File category updated!',
        },
      );

      if (!success) {
        return;
      }

      // Point transformer to the saved category
      transformerData.categoryRef = categoryData.id;
    }

    onUpdate({
      ...transformerData,
      id: transformerData.id
        ? transformerData.id
        : modelTransformerEntityType.generateNewId(),
    });
  }, [categoryMode, form, saveDefinitionWithFeedback, pluginKey, onUpdate]);

  const selectedCategoryId = form.watch('transformer.categoryRef');
  const hasSelectedCategory = categoryOptions.some(
    (o) => o.value === selectedCategoryId,
  );

  return (
    <form
      className="storage:space-y-4"
      id={formId}
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void handleSave();
      }}
    >
      <SelectFieldController
        className="storage:w-full"
        control={form.control}
        label="File Relation"
        name="transformer.fileRelationRef"
        options={relationOptions}
        placeholder="Select a file relation..."
      />

      <div className="storage:space-y-2">
        {categoryMode === 'select' && (
          <ComboboxFieldController
            className="storage:w-full"
            control={form.control}
            label="File Category"
            name="transformer.categoryRef"
            options={categoryOptions}
            placeholder="Select a file category..."
            description="The file category that defines upload constraints and authorization for this relation"
          />
        )}

        <Collapsible open={categoryMode !== 'select'}>
          <div className="storage:flex storage:items-center storage:gap-2">
            {categoryMode === 'select' ? (
              <>
                <CollapsibleTrigger
                  render={
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={handleStartCreate}
                    />
                  }
                >
                  + Create new category
                </CollapsibleTrigger>
                {hasSelectedCategory && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={handleStartEdit}
                  >
                    Edit selected
                  </Button>
                )}
              </>
            ) : (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={handleCancelCategory}
              >
                Cancel {categoryMode === 'create' ? 'creation' : 'editing'}
              </Button>
            )}
          </div>
          <CollapsibleContent>
            <div className="storage:mt-2 storage:space-y-4 storage:rounded-md storage:border storage:p-4">
              <p className="storage:text-sm storage:font-medium">
                {categoryMode === 'create'
                  ? 'New File Category'
                  : 'Edit File Category'}
              </p>
              <FileCategoryFormFields
                lens={lens.focus('category')}
                roleOptions={roleOptions}
                adapterOptions={adapterOptions}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <DialogFooter>
        <DialogClose render={<Button variant="secondary" />}>
          Cancel
        </DialogClose>
        <Button
          type="submit"
          disabled={!isCreate && !isDirty && categoryMode === 'select'}
          form={formId}
        >
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}
