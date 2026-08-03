import type { Lens } from '@hookform/lenses';

import {
  InputFieldController,
  MultiComboboxFieldController,
  SwitchFieldController,
} from '@baseplate-dev/ui-components';
import { useWatch } from 'react-hook-form';

import type { NotificationCategoryInput } from '../schema/plugin-definition.js';

interface NotificationCategoryFormFieldsProps {
  lens: Lens<NotificationCategoryInput>;
  channelOptions: { label: string; value: string }[];
}

export function NotificationCategoryFormFields({
  lens,
  channelOptions,
}: NotificationCategoryFormFieldsProps): React.JSX.Element {
  // A mandatory category never consults preferences, so its defaults are not
  // read either — the type's own `channels` decide.
  const mandatory = useWatch(lens.focus('mandatory').interop());

  return (
    <div className="notifications:space-y-4">
      <InputFieldController
        {...lens.focus('key').interop()}
        label="Key"
        placeholder="e.g., comments"
        description="Must be camelCase. Stored on preference rows — renaming it is a data migration."
      />
      <InputFieldController
        {...lens.focus('label').interop()}
        label="Label"
        placeholder="e.g., Comments"
        description="Shown to users on the notification settings page"
      />
      <MultiComboboxFieldController
        {...lens.focus('defaultChannels').interop()}
        label="Default Channels"
        options={channelOptions}
        placeholder="Select channels..."
        disabled={mandatory}
        description={
          mandatory
            ? 'Ignored for a mandatory category — every type is delivered on the channels it declares.'
            : 'How types in this category are delivered when the user has not chosen. A channel left off here is opt-in.'
        }
      />
      <SwitchFieldController
        {...lens.focus('mandatory').interop()}
        label="Mandatory"
        description="Password resets, security alerts — delivery is not the user's choice, so preferences are never consulted"
      />
    </div>
  );
}
