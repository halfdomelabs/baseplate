import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import { Button } from '@halfdomelabs/ui-components';
import { UseFormReturn } from 'react-hook-form';
import { useBlocker } from 'react-router-dom';

interface ModelFormActionBarProps {
  form: UseFormReturn<ModelConfig>;
}

const ModelFormActionBar = ({ form }: ModelFormActionBarProps): JSX.Element => {
  const { formState } = form;
  const isDirty = Object.keys(formState.dirtyFields).length > 0;

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
  );

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
      {blocker.state === 'blocked' ? (
        <div>
          <p>Are you sure you want to leave?</p>
          <button onClick={() => blocker.proceed()}>Proceed</button>
          <button onClick={() => blocker.reset()}>Cancel</button>
        </div>
      ) : null}
    </div>
  );
};

export default ModelFormActionBar;
