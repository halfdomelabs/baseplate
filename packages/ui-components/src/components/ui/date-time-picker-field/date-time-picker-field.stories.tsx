import type { Meta, StoryObj } from '@storybook/react-vite';

import { parseISO } from 'date-fns';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  DateTimePickerField,
  DateTimePickerFieldController,
} from './date-time-picker-field.js';

const meta = {
  title: 'components/DateTimePickerField',
  component: DateTimePickerField,
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
    },
    placeholder: {
      control: 'text',
    },
    dateTimeFormat: {
      control: 'text',
    },
    showSeconds: {
      control: 'boolean',
    },
    className: {
      control: 'text',
    },
    wrapperClassName: {
      control: 'text',
    },
  },
  args: {
    placeholder: 'Pick date and time',
    dateTimeFormat: 'PPP pp',
    showSeconds: false,
    disabled: false,
  },
} satisfies Meta<typeof DateTimePickerField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: (args) => {
    const [dateTime, setDateTime] = useState<string | undefined>();
    return (
      <DateTimePickerField {...args} value={dateTime} onChange={setDateTime} />
    );
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Meeting Date & Time',
  },
  render: (args) => {
    const [dateTime, setDateTime] = useState<string | undefined>();
    return (
      <DateTimePickerField {...args} value={dateTime} onChange={setDateTime} />
    );
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Appointment',
    description: 'Select the date and time for your appointment',
  },
  render: (args) => {
    const [dateTime, setDateTime] = useState<string | undefined>();
    return (
      <DateTimePickerField {...args} value={dateTime} onChange={setDateTime} />
    );
  },
};

export const WithError: Story = {
  args: {
    label: 'Event Schedule',
    error: 'Please select a valid date and time',
  },
  render: (args) => {
    const [dateTime, setDateTime] = useState<string | undefined>();
    return (
      <DateTimePickerField {...args} value={dateTime} onChange={setDateTime} />
    );
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled DateTime',
    disabled: true,
  },
  render: (args) => {
    const [dateTime, setDateTime] = useState<string | undefined>(
      '2024-01-15T14:30:00.000Z',
    );
    return (
      <DateTimePickerField {...args} value={dateTime} onChange={setDateTime} />
    );
  },
};

export const WithSeconds: Story = {
  args: {
    label: 'Precise Timing',
    showSeconds: true,
    dateTimeFormat: 'PPP pp:ss',
  },
  render: (args) => {
    const [dateTime, setDateTime] = useState<string | undefined>();
    return (
      <DateTimePickerField {...args} value={dateTime} onChange={setDateTime} />
    );
  },
};

export const WithCustomFormat: Story = {
  args: {
    label: 'Custom Format',
    dateTimeFormat: 'MM/dd/yyyy HH:mm',
  },
  render: (args) => {
    const [dateTime, setDateTime] = useState<string | undefined>();
    return (
      <DateTimePickerField {...args} value={dateTime} onChange={setDateTime} />
    );
  },
};

export const WithCustomPlaceholder: Story = {
  args: {
    label: 'Event Start',
    placeholder: 'When does the event start?',
  },
  render: (args) => {
    const [dateTime, setDateTime] = useState<string | undefined>();
    return (
      <DateTimePickerField {...args} value={dateTime} onChange={setDateTime} />
    );
  },
};

export const WithCalendarProps: Story = {
  args: {
    label: 'Future Meetings Only',
    calendarProps: {
      captionLayout: 'dropdown',
      showOutsideDays: false,
      disabled: { before: new Date() },
    },
  },
  render: (args) => {
    const [dateTime, setDateTime] = useState<string | undefined>();
    return (
      <DateTimePickerField {...args} value={dateTime} onChange={setDateTime} />
    );
  },
};

export const Preselected: Story = {
  args: {
    label: 'Preselected DateTime',
    description: 'This field has a default value',
  },
  render: (args) => {
    const [dateTime, setDateTime] = useState<string | undefined>(
      '2024-01-15T14:30:00.000Z',
    );
    return (
      <DateTimePickerField {...args} value={dateTime} onChange={setDateTime} />
    );
  },
};

export const WithFormController: Story = {
  args: {
    label: 'Controlled DateTime',
    description: 'This example uses react-hook-form integration',
  },
  render: (args) => {
    const { control, watch } = useForm<{ dateTime: string | undefined }>({
      defaultValues: { dateTime: undefined },
    });

    const selectedDateTime = watch('dateTime');

    return (
      <div className="space-y-4">
        <DateTimePickerFieldController
          {...args}
          control={control}
          name="dateTime"
        />
        <div className="text-sm text-muted-foreground">
          Selected: {selectedDateTime ?? 'None'}
        </div>
      </div>
    );
  },
};

export const WithFormValidation: Story = {
  args: {
    label: 'Required DateTime',
    description: 'This field is required',
  },
  render: (args) => {
    const {
      control,
      formState: { errors },
      handleSubmit,
    } = useForm<{ dateTime: string | undefined }>({
      defaultValues: { dateTime: undefined },
    });

    const onSubmit = (data: { dateTime: string | undefined }): void => {
      if (!data.dateTime) {
        console.error('Validation failed: DateTime is required');
        return;
      }
      console.info('Form submitted with:', data);
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <DateTimePickerFieldController
          {...args}
          control={control}
          name="dateTime"
          error={errors.dateTime?.message}
        />
        <button
          type="submit"
          className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary-hover"
        >
          Submit
        </button>
      </form>
    );
  },
};

export const MultipleFields: Story = {
  args: {},
  render: () => {
    const [startTime, setStartTime] = useState<string | undefined>();
    const [endTime, setEndTime] = useState<string | undefined>();

    const calculateDuration = (start: string, end: string): number => {
      const startDate = parseISO(start);
      const endDate = parseISO(end);
      return Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60),
      );
    };

    return (
      <div className="space-y-4">
        <DateTimePickerField
          label="Event Start"
          value={startTime}
          onChange={setStartTime}
          calendarProps={{
            disabled: { before: new Date() },
          }}
        />
        <DateTimePickerField
          label="Event End"
          value={endTime}
          onChange={setEndTime}
          calendarProps={{
            disabled: { before: startTime ? parseISO(startTime) : new Date() },
          }}
        />
        <div className="text-sm text-muted-foreground">
          <div>Start: {startTime ?? 'Not set'}</div>
          <div>End: {endTime ?? 'Not set'}</div>
          {startTime && endTime && (
            <div>Duration: {calculateDuration(startTime, endTime)} minutes</div>
          )}
        </div>
      </div>
    );
  },
};

export const TimeOnlyMode: Story = {
  name: 'Focus on Time Selection',
  args: {
    label: 'Time Selection Focus',
    description: 'Pre-set to today, focus on time selection',
  },
  render: (args) => {
    const [dateTime, setDateTime] = useState<string | undefined>(() => {
      const today = new Date();
      today.setHours(9, 0, 0, 0); // 9:00 AM
      return today.toISOString();
    });

    return (
      <DateTimePickerField
        {...args}
        value={dateTime}
        onChange={setDateTime}
        showSeconds={true}
      />
    );
  },
};
