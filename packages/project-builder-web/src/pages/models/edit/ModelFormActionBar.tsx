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
    <div className="absolute bottom-0 left-0 right-0 z-50 flex min-h-[65px] items-center space-x-4 border-t border-border bg-white pl-4">
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
  );
};

export default ModelFormActionBar;
