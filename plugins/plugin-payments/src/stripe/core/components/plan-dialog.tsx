import type React from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  InputFieldController,
  MultiComboboxFieldController,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { BillingPlanDefinition } from '../schema/plugin-definition.js';

import '#src/styles.css';

const planFormSchema = z.object({
  id: z.string(),
  key: z
    .string()
    .min(1, 'Plan key is required')
    .regex(/^[a-z0-9-]+$/, 'Must be kebab-case (e.g. pro-plan)'),
  displayName: z.string().min(1, 'Display name is required'),
  grantedRoles: z.array(z.string()).default([]),
});

/** A role option from the auth plugin. */
export interface AuthRoleOption {
  name: string;
  comment: string;
}

interface PlanDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  plan?: BillingPlanDefinition;
  isNew?: boolean;
  availableRoles: AuthRoleOption[];
  authPluginUrl?: string;
  onSave: (plan: BillingPlanDefinition) => void;
}

export function PlanDialog({
  open,
  onOpenChange,
  plan,
  isNew = false,
  availableRoles,
  authPluginUrl,
  onSave,
}: PlanDialogProps): React.JSX.Element {
  const form = useForm({
    resolver: zodResolver(planFormSchema),
    values: plan,
  });

  const { control, handleSubmit } = form;

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
            <DialogTitle>{isNew ? 'Add Plan' : 'Edit Plan'}</DialogTitle>
            <DialogDescription>
              {isNew
                ? 'Enter the details for the new billing plan.'
                : 'Update the plan details below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="payments:space-y-4 payments:py-4">
            <InputFieldController
              label="Plan Key"
              name="key"
              control={control}
              placeholder="e.g. pro-plan"
              description="Kebab-case identifier used in code and Stripe metadata"
            />
            <InputFieldController
              label="Display Name"
              name="displayName"
              control={control}
              placeholder="e.g. Pro Plan"
            />
            <div>
              <MultiComboboxFieldController
                label="Granted Roles"
                name="grantedRoles"
                control={control}
                options={availableRoles}
                getOptionLabel={(role) => role.name}
                getOptionValue={(role) => role.name}
                placeholder="Select roles..."
                description="Auth roles granted when this plan is active"
              />
              {authPluginUrl ? (
                <p className="payments:mt-1 payments:text-xs payments:text-muted-foreground">
                  Manage roles in the{' '}
                  <a
                    href={authPluginUrl}
                    className="payments:underline payments:hover:text-foreground"
                  >
                    Auth plugin settings
                  </a>
                  .
                </p>
              ) : null}
            </div>
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
              {isNew ? 'Add' : 'Update'} Plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
