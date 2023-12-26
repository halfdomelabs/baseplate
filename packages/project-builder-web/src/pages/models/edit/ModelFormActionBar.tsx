import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import { Button } from '@halfdomelabs/ui-components';
import { UseFormReturn } from 'react-hook-form';

interface ModelFormActionBarProps {
  form: UseFormReturn<ModelConfig>;
}
const ModelFormActionBar = ({ form }: ModelFormActionBarProps): JSX.Element => {
  const { formState } = form;
  const isDirty = Object.keys(formState.dirtyFields).length > 0;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 block min-h-[65px] border-t border-border bg-white">
      <div className="float-left block w-2/3 space-x-2 p-3"></div>
      <div className="float-left ml-auto block w-1/3 p-3">
        <div className="flex items-center justify-end space-x-2">
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
