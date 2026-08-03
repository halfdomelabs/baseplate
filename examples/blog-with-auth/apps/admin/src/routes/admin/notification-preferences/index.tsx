import type { ReactElement } from 'react';

import { useMutation, useQuery } from '@apollo/client/react';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';

import type { NotificationChannel } from '@src/gql/graphql';

import { Button } from '@src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@src/components/ui/card';
import { ErrorableLoader } from '@src/components/ui/errorable-loader';
import { Label } from '@src/components/ui/label';
import { Switch } from '@src/components/ui/switch';
import { logAndFormatError } from '@src/services/error-formatter';

import {
  clearNotificationPreferenceMutation,
  notificationPreferencesQuery,
  setNotificationPreferenceMutation,
} from './-operations';

export const Route = createFileRoute('/admin/notification-preferences/')({
  loader: () => ({ crumb: 'Notification Preferences' }),
  component: NotificationPreferencesPage,
});

/** Display copy for the routing targets the backend enumerates. */
const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  inApp: 'In-app',
  email: 'Email',
};

function NotificationPreferencesPage(): ReactElement {
  const { data, error } = useQuery(notificationPreferencesQuery);
  // Refetched rather than merged from the payload: these types are keyless, so
  // Apollo cannot normalize the returned categories onto the cached query.
  const mutationOptions = {
    refetchQueries: [notificationPreferencesQuery],
    awaitRefetchQueries: true,
  };
  const [setPreference] = useMutation(
    setNotificationPreferenceMutation,
    mutationOptions,
  );
  const [clearPreference] = useMutation(
    clearNotificationPreferenceMutation,
    mutationOptions,
  );

  if (!data) {
    return <ErrorableLoader error={error} />;
  }

  async function handleToggle(
    scopeKey: string,
    channel: NotificationChannel,
    enabled: boolean,
  ): Promise<void> {
    try {
      await setPreference({
        variables: {
          input: { scopeKind: 'CATEGORY', scopeKey, channel, enabled },
        },
      });
    } catch (err: unknown) {
      toast.error(
        logAndFormatError(err, 'Sorry, we could not save that preference.'),
      );
    }
  }

  async function handleReset(
    scopeKey: string,
    channel: NotificationChannel,
  ): Promise<void> {
    try {
      await clearPreference({
        variables: { input: { scopeKind: 'CATEGORY', scopeKey, channel } },
      });
      toast.success('Restored the default.');
    } catch (err: unknown) {
      toast.error(
        logAndFormatError(err, 'Sorry, we could not restore the default.'),
      );
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1>Notification Preferences</h1>
        <p className="text-sm text-muted-foreground">
          Choose how you are notified. Categories with no choice of your own use
          the default this project ships with.
        </p>
      </div>

      {data.notificationPreferences.map((category) => (
        <Card key={category.key}>
          <CardHeader>
            <CardTitle>{category.label}</CardTitle>
            {/* A mandatory category returns no channels: there is nothing to
                toggle, so say why rather than rendering a dead control. */}
            {category.mandatory ? (
              <CardDescription>
                Always sent — these notifications are required and cannot be
                turned off.
              </CardDescription>
            ) : null}
          </CardHeader>
          {category.channels ? (
            <CardContent className="space-y-3">
              {category.channels.map((channel) => {
                const controlId = `${category.key}-${channel.channel}`;
                return (
                  <div
                    key={channel.channel}
                    className="flex items-center justify-between gap-4"
                  >
                    <Label htmlFor={controlId}>
                      {CHANNEL_LABELS[channel.channel]}
                    </Label>
                    <div className="flex items-center gap-3">
                      {channel.isDefault ? (
                        <span className="text-xs text-muted-foreground">
                          Default
                        </span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            void handleReset(category.key, channel.channel);
                          }}
                        >
                          Reset
                        </Button>
                      )}
                      <Switch
                        id={controlId}
                        checked={channel.enabled}
                        onCheckedChange={(checked) => {
                          void handleToggle(
                            category.key,
                            channel.channel,
                            checked,
                          );
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
