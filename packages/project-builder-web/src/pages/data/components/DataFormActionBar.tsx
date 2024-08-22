import { Button } from '@halfdomelabs/ui-components';
import { UseFormReturn } from 'react-hook-form';

interface DataFormActionBarProps {
  // we don't care about the form type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
}

const DataFormActionBar = ({ form }: DataFormActionBarProps): JSX.Element => {
  const { formState } = form;
  const isDirty = Object.keys(formState.dirtyFields).length > 0;

  return (
    <div className="absolute inset-x-0 bottom-0 z-50 flex min-h-[--action-bar-height] items-center space-x-4 border-t border-border bg-white pl-4">
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

export default DataFormActionBar;
