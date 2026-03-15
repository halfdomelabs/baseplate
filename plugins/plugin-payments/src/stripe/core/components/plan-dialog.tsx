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
  grantedRolesInput: z.string().default(''),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

/** Converts a BillingPlanDefinition to form values. */
function toFormValues(plan: BillingPlanDefinition): PlanFormValues {
  return {
    id: plan.id,
    key: plan.key,
    displayName: plan.displayName,
    grantedRolesInput: plan.grantedRoles.join(', '),
  };
}

/** Converts form values back to a BillingPlanDefinition. */
function fromFormValues(values: PlanFormValues): BillingPlanDefinition {
  return {
    id: values.id,
    key: values.key,
    displayName: values.displayName,
    grantedRoles: values.grantedRolesInput
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean),
  };
}

interface PlanDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  plan?: BillingPlanDefinition;
  isNew?: boolean;
  onSave: (plan: BillingPlanDefinition) => void;
}

export function PlanDialog({
  open,
  onOpenChange,
  plan,
  isNew = false,
  onSave,
}: PlanDialogProps): React.JSX.Element {
  const form = useForm({
    resolver: zodResolver(planFormSchema),
    values: plan ? toFormValues(plan) : undefined,
  });

  const { control, handleSubmit } = form;

  const onSubmit = handleSubmit((data) => {
    onSave(fromFormValues(data));
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
            <InputFieldController
              label="Granted Roles"
              name="grantedRolesInput"
              control={control}
              placeholder="e.g. PRO_USER, PREMIUM_USER"
              description="Auth roles granted when this plan is active (comma-separated)"
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
              {isNew ? 'Add' : 'Update'} Plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
