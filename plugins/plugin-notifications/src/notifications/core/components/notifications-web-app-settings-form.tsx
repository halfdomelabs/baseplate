import type { WebAppSettingsFormProps } from '@baseplate-dev/project-builder-lib/web';
import type React from 'react';

import { SwitchFieldController } from '@baseplate-dev/ui-components';

/**
 * Renders the notifications per-app settings (notification bell/feed toggle) in
 * the web app settings page. Bound to `pluginData[pluginKey]` on the shared web
 * app form.
 */
export function NotificationsWebAppSettingsForm({
  formProps,
  pluginKey,
}: WebAppSettingsFormProps): React.JSX.Element {
  return (
    <SwitchFieldController
      label="Include Notifications?"
      control={formProps.control}
      name={`pluginData.${pluginKey}.includeNotifications`}
    />
  );
}
