import type { WebAppSettingsFormProps } from '@baseplate-dev/project-builder-lib/web';
import type React from 'react';

import { SwitchFieldController } from '@baseplate-dev/ui-components';

/**
 * Renders the storage per-app settings (upload components toggle) in the web app
 * settings page. Bound to `pluginData[pluginKey]` on the shared web app form.
 */
export function StorageWebAppSettingsForm({
  formProps,
  pluginKey,
}: WebAppSettingsFormProps): React.JSX.Element {
  return (
    <SwitchFieldController
      label="Include Upload Components?"
      control={formProps.control}
      name={`pluginData.${pluginKey}.includeUploadComponents`}
    />
  );
}
