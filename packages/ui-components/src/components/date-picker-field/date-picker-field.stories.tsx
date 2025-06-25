import type { Meta, StoryObj } from '@storybook/react';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  DatePickerField,
  DatePickerFieldController,
} from './date-picker-field.js';

const meta = {
  component: DatePickerField,
  tags: ['autodocs'],
  argTypes: {
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
} satisfies Meta<typeof DatePickerField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>();
    return <DatePickerField {...args} value={date} onChange={setDate} />;
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Select Date',
  },
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>();
    return <DatePickerField {...args} value={date} onChange={setDate} />;
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Birth Date',
    description: 'Please select your date of birth',
  },
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>();
    return <DatePickerField {...args} value={date} onChange={setDate} />;
  },
};

export const WithError: Story = {
  args: {
    label: 'Due Date',
    error: 'Please select a valid date',
  },
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>();
    return <DatePickerField {...args} value={date} onChange={setDate} />;
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Date',
    disabled: true,
  },
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return <DatePickerField {...args} value={date} onChange={setDate} />;
  },
};

export const WithCustomFormat: Story = {
  args: {
    label: 'Custom Format',
    dateFormat: 'MM/dd/yyyy',
  },
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>();
    return <DatePickerField {...args} value={date} onChange={setDate} />;
  },
};

export const WithCustomPlaceholder: Story = {
  args: {
    label: 'Event Date',
    placeholder: 'Choose event date',
  },
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>();
    return <DatePickerField {...args} value={date} onChange={setDate} />;
  },
};

export const WithCalendarProps: Story = {
  args: {
    label: 'Meeting Date',
    calendarProps: {
      captionLayout: 'dropdown',
      showOutsideDays: false,
      disabled: { before: new Date() },
    },
  },
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>();
    return <DatePickerField {...args} value={date} onChange={setDate} />;
  },
};

export const WithFormController: Story = {
  args: {
    label: 'Controlled Date',
    description: 'This example uses react-hook-form integration',
  },
  render: (args) => {
    const { control, watch } = useForm<{ date: Date | undefined }>({
      defaultValues: { date: undefined },
    });

    const selectedDate = watch('date');

    return (
      <div className="space-y-4">
        <DatePickerFieldController {...args} control={control} name="date" />
        <div className="text-sm text-muted-foreground">
          Selected: {selectedDate ? selectedDate.toDateString() : 'None'}
        </div>
      </div>
    );
  },
};

export const WithFormValidation: Story = {
  args: {
    label: 'Required Date',
    description: 'This field is required',
  },
  render: (args) => {
    const {
      control,
      formState: { errors },
    } = useForm<{ date: Date | undefined }>({
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

export const Preselected: Story = {
  args: {
    label: 'Preselected Date',
    description: 'This field has a default value',
  },
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return <DatePickerField {...args} value={date} onChange={setDate} />;
  },
};
