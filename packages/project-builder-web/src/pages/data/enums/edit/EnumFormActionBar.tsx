import { EnumConfig } from '@halfdomelabs/project-builder-lib';
import { Button } from '@halfdomelabs/ui-components';
import { UseFormReturn } from 'react-hook-form';
import { MdOutlineSave } from 'react-icons/md';

import { hasDirtyFields } from '@src/utils/form';

interface EnumFormActionBarProps {
  form: UseFormReturn<EnumConfig>;
}

const EnumFormActionBar = ({ form }: EnumFormActionBarProps): JSX.Element => {
  const { formState } = form;
  const isDirty = hasDirtyFields(formState);

  return (
    <div className="absolute inset-x-0 bottom-0 z-50 flex items-center space-x-4 border-t border-border bg-white py-2.5 pl-4">
      <Button
        variant="secondary"
        size="sm"
        type="button"
        onClick={() => form.reset()}
        disabled={formState.isSubmitting || !isDirty}
      >
        Reset
      </Button>
      <Button.WithIcon
        icon={MdOutlineSave}
        variant="default"
        size="sm"
        type="submit"
        disabled={formState.isSubmitting || !isDirty}
      >
        Save
      </Button.WithIcon>
    </div>
  );
};

export default EnumFormActionBar;
