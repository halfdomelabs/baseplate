import type React from 'react';
import type { Control } from 'react-hook-form';

import {
  Button,
  RecordView,
  RecordViewActions,
  RecordViewItem,
  RecordViewItemList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  useConfirmDialog,
} from '@baseplate-dev/ui-components';
import { useFieldArray } from '@hookform/lenses/rhf';
import { useState } from 'react';
import { useWatch } from 'react-hook-form';
import { MdAdd, MdDeleteOutline, MdEdit } from 'react-icons/md';

import type { BillingPlanDefinition } from '../schema/plugin-definition.js';
import type { AuthRoleOption } from './plan-dialog.js';
import type { StripeBillingFormValues } from './stripe-definition-editor.js';

import { billingPlanEntityType } from '../schema/plugin-definition.js';
import { PlanDialog } from './plan-dialog.js';

import '#src/styles.css';

interface Props {
  control: Control<StripeBillingFormValues>;
  availableRoles: AuthRoleOption[];
  authPluginUrl?: string;
}

export function PlanEditorForm({
  control,
  availableRoles,
  authPluginUrl,
}: Props): React.JSX.Element {
  const { requestConfirm } = useConfirmDialog();
  const { append, update, remove } = useFieldArray({
    control,
    name: 'billing.plans',
  });
  const [planToEdit, setPlanToEdit] = useState<
    BillingPlanDefinition | undefined
  >();
  const [isEditing, setIsEditing] = useState(false);

  const watchedPlans = useWatch({ control, name: 'billing.plans' });
  const plans: BillingPlanDefinition[] = (watchedPlans ??
    []) as BillingPlanDefinition[];

  function handleSavePlan(newPlan: BillingPlanDefinition): void {
    const existingIndex = plans.findIndex((p) => p.id === newPlan.id);
    if (existingIndex === -1) {
      append(newPlan);
    } else {
      update(existingIndex, newPlan);
    }
  }

  function handleDeletePlan(planIdx: number): void {
    const plan = plans[planIdx];
    requestConfirm({
      title: 'Delete Plan',
      content: `Are you sure you want to delete the plan "${plan.displayName}"?`,
      onConfirm: () => {
        remove(planIdx);
      },
    });
  }

  return (
    <SectionListSection>
      <SectionListSectionHeader>
        <SectionListSectionTitle>Subscription Plans</SectionListSectionTitle>
        <SectionListSectionDescription>
          Define the subscription plans available to your users. Each plan
          generates a config entry with placeholder Stripe Price IDs that you
          replace with your actual IDs.
        </SectionListSectionDescription>
      </SectionListSectionHeader>
      <SectionListSectionContent className="payments:space-y-4">
        {plans.map((plan, planIdx) => (
          <RecordView key={plan.id}>
            <RecordViewItemList>
              <RecordViewItem title="Key">{plan.key}</RecordViewItem>
              <RecordViewItem title="Display Name">
                {plan.displayName}
              </RecordViewItem>
              <RecordViewItem title="Granted Roles">
                {plan.grantedRoles.length > 0 ? (
                  plan.grantedRoles.join(', ')
                ) : (
                  <span className="payments:text-muted-foreground">None</span>
                )}
              </RecordViewItem>
            </RecordViewItemList>
            <RecordViewActions>
              <Button
                variant="ghost"
                size="icon"
                title="Edit"
                aria-label="Edit plan"
                onClick={() => {
                  setPlanToEdit(plan);
                  setIsEditing(true);
                }}
              >
                <MdEdit />
              </Button>
              <Button
                variant="ghostDestructive"
                size="icon"
                title="Delete"
                aria-label="Delete plan"
                onClick={() => {
                  handleDeletePlan(planIdx);
                }}
              >
                <MdDeleteOutline />
              </Button>
            </RecordViewActions>
          </RecordView>
        ))}
        <PlanDialog
          open={isEditing}
          onOpenChange={setIsEditing}
          plan={planToEdit}
          isNew={planToEdit ? !plans.some((p) => p.id === planToEdit.id) : true}
          availableRoles={availableRoles}
          authPluginUrl={authPluginUrl}
          onSave={handleSavePlan}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setPlanToEdit({
              id: billingPlanEntityType.generateNewId(),
              key: '',
              displayName: '',
              grantedRoles: [],
            });
            setIsEditing(true);
          }}
        >
          <MdAdd />
          Add Plan
        </Button>
      </SectionListSectionContent>
    </SectionListSection>
  );
}
