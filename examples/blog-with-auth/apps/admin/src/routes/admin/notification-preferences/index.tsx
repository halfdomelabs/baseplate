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

/** The feed has no window to batch over, so it cannot be digested. */
const IN_APP_CHANNEL: NotificationChannel = 'inApp';

/**
 * The modes a channel offers. DIGEST is outbound-only — the backend clamps an
 * in-app row asking for it back to immediate, so offering it here would be a
 * control that lies.
 */
function availableModes(channel: NotificationChannel): NotificationMode[] {
  return channel === IN_APP_CHANNEL
    ? ['OFF', 'IMMEDIATE']
    : ['OFF', 'IMMEDIATE', 'DIGEST'];
}

/**
 * Windows offered for a digest, in seconds.
 *
 * Bounded by what the backend accepts: a window it would reject, or one long
 * enough to be expired before it sends, must not be selectable.
 */
const DIGEST_WINDOW_OPTIONS = [
  { seconds: 900, label: 'Every 15 minutes' },
  { seconds: 3600, label: 'Hourly' },
  { seconds: 14_400, label: 'Every 4 hours' },
  { seconds: 86_400, label: 'Daily' },
] as const;

/** Matches the backend's window when a preference row names none. */
const DEFAULT_DIGEST_WINDOW_SECONDS = 900;

/**
 * Display copy for a stored window.
 *
 * A topic default may name a window this page does not offer, so an unmatched
 * value renders as itself rather than falling back to a wrong label.
 */
function digestWindowLabel(seconds: number | null | undefined): string {
  const resolved = seconds ?? DEFAULT_DIGEST_WINDOW_SECONDS;
  const option = DIGEST_WINDOW_OPTIONS.find(
    (candidate) => candidate.seconds === resolved,
  );
  return option?.label ?? `Every ${resolved}s`;
}

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

  async function handlePreferenceChange(
    topicKey: string,
    channel: NotificationChannel,
    mode: NotificationMode,
    digestWindowSeconds?: number,
  ): Promise<void> {
    try {
      await setPreference({
        variables: {
          input: {
            topicKey,
            channel,
            mode,
            // Only meaningful for a digest; the backend stores null otherwise,
            // so sending one for another mode would be discarded anyway.
            ...(mode === 'DIGEST' ? { digestWindowSeconds } : {}),
          },
        },
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
                    {channel.mode === 'DIGEST' && (
                      <Select
                        value={String(
                          channel.digestWindowSeconds ??
                            DEFAULT_DIGEST_WINDOW_SECONDS,
                        )}
                        onValueChange={(window) => {
                          if (!window) return;
                          void handlePreferenceChange(
                            topic.key,
                            channel.channel,
                            'DIGEST',
                            Number(window),
                          );
                        }}
                      >
                        <SelectTrigger
                          aria-label={`${CHANNEL_LABELS[channel.channel]} digest frequency`}
                          className="w-40"
                        >
                          {/* Base UI renders the raw value unless given a label. */}
                          <SelectValue>
                            {digestWindowLabel(channel.digestWindowSeconds)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {DIGEST_WINDOW_OPTIONS.map((option) => (
                            <SelectItem
                              key={option.seconds}
                              value={String(option.seconds)}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Select
                      value={channel.mode}
                      onValueChange={(mode) => {
                        // Guarded rather than asserted: the Select types its
                        // value as possibly-undefined, and a no-op is the right
                        // response to a clear.
                        if (!mode) return;
                        void handlePreferenceChange(
                          topic.key,
                          channel.channel,
                          mode,
                          // Carried over, so switching to digest keeps the
                          // window already shown rather than silently resetting.
                          channel.digestWindowSeconds ??
                            DEFAULT_DIGEST_WINDOW_SECONDS,
                        );
                      }}
                    >
                      <SelectTrigger id={controlId} className="w-40">
                        <SelectValue>{MODE_LABELS[channel.mode]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {availableModes(channel.channel).map((mode) => (
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
