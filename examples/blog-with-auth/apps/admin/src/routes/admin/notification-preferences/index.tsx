import type { ReactElement } from 'react';

import { useMutation, useQuery } from '@apollo/client/react';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';

import type { NotificationChannel, NotificationMode } from '@src/gql/graphql';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/components/ui/select';
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

const MODE_LABELS: Record<NotificationMode, string> = {
  OFF: 'Off',
  IMMEDIATE: 'Immediately',
  DIGEST: 'Digest',
};

/**
 * The modes this page offers.
 *
 * DIGEST is deliberately absent even though the schema accepts it for outbound
 * channels: nothing batches deliveries yet, so a digest preference would be
 * stored and then delivered immediately. Offering it would be a control that
 * lies. Add it here when digest delivery lands.
 */
const AVAILABLE_MODES: NotificationMode[] = ['OFF', 'IMMEDIATE'];

function NotificationPreferencesPage(): ReactElement {
  const { data, error } = useQuery(notificationPreferencesQuery);
  // Refetched rather than merged from the payload: these types are keyless, so
  // Apollo cannot normalize the returned topics onto the cached query.
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

  async function handleModeChange(
    topicKey: string,
    channel: NotificationChannel,
    mode: NotificationMode,
  ): Promise<void> {
    try {
      await setPreference({
        variables: { input: { topicKey, channel, mode } },
      });
    } catch (err: unknown) {
      toast.error(
        logAndFormatError(err, 'Sorry, we could not save that preference.'),
      );
    }
  }

  async function handleReset(
    topicKey: string,
    channel: NotificationChannel,
  ): Promise<void> {
    try {
      await clearPreference({ variables: { input: { topicKey, channel } } });
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
          Choose how you are notified. Topics with no choice of your own use the
          default this project ships with. Some notifications — security alerts,
          for instance — belong to no topic and are always sent.
        </p>
      </div>

      {data.notificationPreferences.map((topic) => (
        <Card key={topic.key}>
          <CardHeader>
            <CardTitle>{topic.label}</CardTitle>
            {topic.description ? (
              <CardDescription>{topic.description}</CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            {topic.channels.map((channel) => {
              const controlId = `${topic.key}-${channel.channel}`;
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
                          void handleReset(topic.key, channel.channel);
                        }}
                      >
                        Reset
                      </Button>
                    )}
                    <Select
                      value={channel.mode}
                      onValueChange={(mode) => {
                        // Guarded rather than asserted: the Select types its
                        // value as possibly-undefined, and a no-op is the right
                        // response to a clear.
                        if (!mode) return;
                        void handleModeChange(topic.key, channel.channel, mode);
                      }}
                    >
                      <SelectTrigger id={controlId} className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_MODES.map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {MODE_LABELS[mode]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
