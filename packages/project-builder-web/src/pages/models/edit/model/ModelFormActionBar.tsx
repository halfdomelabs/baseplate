import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import { Button, useConfirmDialog } from '@halfdomelabs/ui-components';
import { UseFormReturn } from 'react-hook-form';

import { useModelEditContext } from '../ModelEditContext';

const ModelFormActionBar = ({
  form,
}: {
  form: UseFormReturn<ModelConfig>;
}): JSX.Element => {
  const { formState } = form;
  const isDirty = Object.keys(formState.dirtyFields).length > 0;
  const { isModelNew, onDelete, model } = useModelEditContext();
  const { requestConfirm } = useConfirmDialog();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 block min-h-[56px] w-full bg-white shadow">
      <div className="float-left block w-2/3">
        <div className="mr-auto flex flex-row justify-start space-x-2 p-3">
          {!isModelNew && (
            <Button
              variant="destructive"
              onClick={() => {
                requestConfirm({
                  title: 'Confirm delete',
                  content: `Are you sure you want to delete ${
                    model?.name ?? 'the model'
                  }?`,
                  buttonConfirmText: 'Delete',
                  onConfirm: onDelete,
                });
              }}
            >
              Delete Model
            </Button>
          )}
        </div>
      </div>

      <div className="float-left block w-1/3">
        <div className="ml-auto flex flex-row justify-end space-x-2 p-3">
          <Button
            variant="secondary"
            type="button"
            onClick={() => form.reset()}
            disabled={formState.isSubmitting || !isDirty}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            type="submit"
            disabled={formState.isSubmitting || !isDirty}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModelFormActionBar;
