import type React from 'react';
import type { Control } from 'react-hook-form';

import { InputFieldController } from '@baseplate-dev/ui-components';

import type { SetupWizardInput } from '../setup-wizard-schema.js';

interface BasicsSectionProps {
  control: Control<SetupWizardInput>;
}

export function BasicsSection({
  control,
}: BasicsSectionProps): React.ReactElement {
  return (
    <InputFieldController
      name="name"
      label="Project name"
      description="Lowercase letters and dashes, e.g. my-project"
      control={control}
      placeholder="e.g. my-project"
    />
  );
}
