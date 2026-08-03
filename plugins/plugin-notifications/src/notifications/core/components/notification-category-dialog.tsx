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

import type { NotificationCategoryInput } from '../schema/plugin-definition.js';

import { createNotificationCategorySchema } from '../schema/plugin-definition.js';
import { NotificationCategoryFormFields } from './notification-category-form-fields.js';

/**
 * The routing targets a category can default to.
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

interface NotificationCategoryDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  category?: NotificationCategoryInput;
  isNew?: boolean;
  onSave: (category: NotificationCategoryInput) => void;
}

export function NotificationCategoryDialog({
  open,
  onOpenChange,
  category,
  isNew = false,
  onSave,
}: NotificationCategoryDialogProps): React.JSX.Element {
  const notificationCategorySchema = useDefinitionSchema(
    createNotificationCategorySchema,
  );
  const form = useForm<NotificationCategoryInput>({
    resolver: zodResolver(notificationCategorySchema),
    values: category,
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
            <DialogTitle>
              {isNew ? 'Add Category' : 'Edit Category'}
            </DialogTitle>
            <DialogDescription>
              {isNew
                ? 'Enter the details for the new notification category.'
                : 'Update the notification category details below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="notifications:py-4">
            <NotificationCategoryFormFields
              lens={lens}
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
              {isNew ? 'Add' : 'Update'} Category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
