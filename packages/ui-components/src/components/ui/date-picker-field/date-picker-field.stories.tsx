import type { Meta, StoryObj } from '@storybook/react-vite';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { createFieldStates } from '#src/stories/field-states.js';

import {
  DatePickerField,
  DatePickerFieldController,
} from './date-picker-field.js';

const meta = {
  title: 'components/DatePickerField',
  component: DatePickerField,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'default', 'xl'] },
    disabled: {
      control: 'boolean',
    },
    placeholder: {
      control: 'text',
    },
    dateFormat: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
    wrapperClassName: {
      control: 'text',
    },
  },
  args: {
    placeholder: 'Pick a date',
    dateFormat: 'PPP',
    disabled: false,
  },
  render: function DatePickerFieldStory(args) {
    const [date, setDate] = useState<string | null | undefined>(args.value);
    return <DatePickerField {...args} value={date} onChange={setDate} />;
  },
} satisfies Meta<typeof DatePickerField>;

export default meta;
type Story = StoryObj<typeof meta>;

const states = createFieldStates({
  label: 'Birth date',
  description: 'Please select your date of birth.',
  error: 'Please select a valid date.',
});

export const Default: Story = { args: states.Default };
export const WithLabel: Story = { args: states.WithLabel };
export const WithDescription: Story = { args: states.WithDescription };
export const DescriptionWithoutLabel: Story = {
  args: states.DescriptionWithoutLabel,
};
export const WithError: Story = { args: states.WithError };
export const ErrorOnly: Story = { args: states.ErrorOnly };
export const Disabled: Story = {
  args: { ...states.Disabled, value: '2024-01-15' },
};

export const Preselected: Story = {
  args: { label: 'Preselected date', value: '2024-01-15' },
};

export const WithCustomFormat: Story = {
  args: { label: 'Custom format', dateFormat: 'MM/dd/yyyy' },
};

export const WithCustomPlaceholder: Story = {
  args: { label: 'Event date', placeholder: 'Choose event date' },
};

export const WithCalendarProps: Story = {
  args: {
    label: 'Meeting date',
    calendarProps: {
      captionLayout: 'dropdown',
      showOutsideDays: false,
      disabled: { before: new Date() },
    },
  },
};

export const WithFormController: Story = {
  args: {
    label: 'Controlled date',
    description: 'This example uses react-hook-form integration.',
  },
  render: function DatePickerFieldControllerStory(args) {
    const { control, watch } = useForm<{ date: string | undefined }>({
      defaultValues: { date: undefined },
    });

    const selectedDate = watch('date');

    return (
      <div className="space-y-4">
        <DatePickerFieldController {...args} control={control} name="date" />
        <div className="text-sm text-muted-foreground">
          Selected: {selectedDate ?? 'None'}
        </div>
      </div>
    );
  },
};

export const WithFormValidation: Story = {
  args: {
    label: 'Required date',
    description: 'This field is required.',
  },
  render: function DatePickerFieldValidationStory(args) {
    const {
      control,
      formState: { errors },
    } = useForm<{ date: string | undefined }>({
      defaultValues: { date: undefined },
    });

    return (
      <DatePickerFieldController
        {...args}
        control={control}
        name="date"
        error={errors.date?.message}
      />
    );
  },
};
