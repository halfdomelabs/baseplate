import type React from 'react';

import { useDefinitionSchema } from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@baseplate-dev/ui-components';
import { useLens } from '@hookform/lenses';
import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';

import type { NotificationTopicInput } from '../schema/plugin-definition.js';

import { createNotificationTopicSchema } from '../schema/plugin-definition.js';
import { NotificationTopicFormFields } from './notification-topic-form-fields.js';

/**
 * The routing targets a topic can default to.
 *
 * `inApp` is always available — it is a flag on the row plus a publish, not an
 * installed channel. `email` is offered whether or not the email plugin is
 * enabled; the generated defaults are typed as routing targets, so choosing a
 * channel the app has not installed fails the generated app's build rather than
 * being silently ignored.
 */
const CHANNEL_OPTIONS = [
  { label: 'In-App', value: 'inApp' },
  { label: 'Email', value: 'email' },
];

interface NotificationTopicDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  topic?: NotificationTopicInput;
  isNew?: boolean;
  onSave: (topic: NotificationTopicInput) => void;
}

export function NotificationTopicDialog({
  open,
  onOpenChange,
  topic,
  isNew = false,
  onSave,
}: NotificationTopicDialogProps): React.JSX.Element {
  const notificationTopicSchema = useDefinitionSchema(
    createNotificationTopicSchema,
  );
  const form = useForm<NotificationTopicInput>({
    resolver: zodResolver(notificationTopicSchema),
    values: topic,
  });

  const { control, handleSubmit } = form;
  const lens = useLens({ control });

  const onSubmit = handleSubmit((data) => {
    onSave(data);
    onOpenChange?.(false);
  });

  const formId = useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          id={formId}
          onSubmit={(e) => {
            e.stopPropagation();
            return onSubmit(e);
          }}
        >
          <DialogHeader>
            <DialogTitle>{isNew ? 'Add Topic' : 'Edit Topic'}</DialogTitle>
            <DialogDescription>
              {isNew
                ? 'Enter the details for the new notification topic.'
                : 'Update the notification topic details below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="notifications:py-4">
            <NotificationTopicFormFields
              lens={lens}
              control={control}
              channelOptions={CHANNEL_OPTIONS}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange?.(false);
              }}
            >
              Cancel
            </Button>
            <Button form={formId} type="submit">
              {isNew ? 'Add' : 'Update'} Topic
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
