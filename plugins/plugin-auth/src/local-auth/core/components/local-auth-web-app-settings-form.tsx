import type { WebAppSettingsFormProps } from '@baseplate-dev/project-builder-lib/web';
import type React from 'react';

import { SwitchFieldController } from '@baseplate-dev/ui-components';

/**
 * Renders the local-auth per-app settings (disable registration toggle) in
 * the web app settings page. Bound to `pluginData[pluginKey]` on the shared
 * web app form.
 */
export function LocalAuthWebAppSettingsForm({
  formProps,
  pluginKey,
}: WebAppSettingsFormProps): React.JSX.Element {
  return (
    <SwitchFieldController
      label="Disable Registration"
      description="When enabled, this site's sign-up page and link are hidden so users can only be added via an invite."
      control={formProps.control}
      name={`pluginData.${pluginKey}.disableRegistration`}
    />
  );
}
