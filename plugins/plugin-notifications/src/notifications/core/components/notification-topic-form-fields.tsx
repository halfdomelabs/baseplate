import type { Lens } from '@hookform/lenses';
import type { Control, FieldPath } from 'react-hook-form';

import {
  InputFieldController,
  SelectFieldController,
} from '@baseplate-dev/ui-components';

import type { NotificationTopicInput } from '../schema/plugin-definition.js';

/**
 * Modes offered per channel. `digest` is outbound-only — the feed has no window
 * to batch over — so the in-app row drops it.
 */
const OUTBOUND_MODE_OPTIONS = [
  { label: 'Off', value: 'off' },
  { label: 'Immediate', value: 'immediate' },
  { label: 'Digest', value: 'digest' },
];

const IN_APP_MODE_OPTIONS = OUTBOUND_MODE_OPTIONS.filter(
  (option) => option.value !== 'digest',
);

interface NotificationTopicFormFieldsProps {
  lens: Lens<NotificationTopicInput>;
  control: Control<NotificationTopicInput>;
  channelOptions: { label: string; value: string }[];
}

export function NotificationTopicFormFields({
  lens,
  control,
  channelOptions,
}: NotificationTopicFormFieldsProps): React.JSX.Element {
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
      <InputFieldController
        {...lens.focus('description').interop()}
        label="Description"
        placeholder="Optional helper copy"
        description="Shown under the label on the settings page"
      />
      <div className="notifications:space-y-2">
        <p className="notifications:text-sm notifications:font-medium">
          Default Delivery
        </p>
        <p className="notifications:text-sm notifications:text-muted-foreground">
          How types in this topic are delivered when the user has not chosen. A
          channel left off is opt-in.
        </p>
        {channelOptions.map((channel) => (
          <SelectFieldController
            key={channel.value}
            control={control}
            // Addressed by name rather than through the lens: `defaults` is a
            // record keyed by channel, which a lens cannot traverse.
            name={
              `defaults.${channel.value}.mode` as FieldPath<NotificationTopicInput>
            }
            label={channel.label}
            options={
              channel.value === 'inApp'
                ? IN_APP_MODE_OPTIONS
                : OUTBOUND_MODE_OPTIONS
            }
          />
        ))}
      </div>
    </div>
  );
}
