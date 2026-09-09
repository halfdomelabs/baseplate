import type { Meta, StoryObj } from '@storybook/react-vite';

import { parseISO } from 'date-fns';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { createFieldStates } from '#src/stories/field-states.js';

import {
  DateTimePickerField,
  DateTimePickerFieldController,
} from './date-time-picker-field.js';

const meta = {
  title: 'components/DateTimePickerField',
  component: DateTimePickerField,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'default', 'xl'] },
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
  render: function DateTimePickerFieldStory(args) {
    const [dateTime, setDateTime] = useState<string | null | undefined>(
      args.value,
    );
    return (
      <DateTimePickerField {...args} value={dateTime} onChange={setDateTime} />
    );
  },
} satisfies Meta<typeof DateTimePickerField>;

export default meta;
type Story = StoryObj<typeof meta>;

const PRESET = '2024-01-15T14:30:00.000Z';

const states = createFieldStates({
  label: 'Appointment',
  description: 'Select the date and time for your appointment.',
  error: 'Please select a valid date and time.',
});

export const Default: Story = { args: states.Default };
export const WithLabel: Story = { args: states.WithLabel };
export const WithDescription: Story = { args: states.WithDescription };
export const DescriptionWithoutLabel: Story = {
  args: states.DescriptionWithoutLabel,
};
export const WithError: Story = { args: states.WithError };
export const ErrorOnly: Story = { args: states.ErrorOnly };
export const Disabled: Story = { args: { ...states.Disabled, value: PRESET } };

export const Preselected: Story = {
  args: { label: 'Preselected date and time', value: PRESET },
};

export const WithSeconds: Story = {
  args: {
    label: 'Precise timing',
    showSeconds: true,
    dateTimeFormat: 'PPP pp:ss',
  },
};

export const WithCustomFormat: Story = {
  args: { label: 'Custom format', dateTimeFormat: 'MM/dd/yyyy HH:mm' },
};

export const WithCustomPlaceholder: Story = {
  args: { label: 'Event start', placeholder: 'When does the event start?' },
};

export const WithCalendarProps: Story = {
  args: {
    label: 'Future meetings only',
    calendarProps: {
      captionLayout: 'dropdown',
      showOutsideDays: false,
      disabled: { before: new Date() },
    },
  },
};

export const WithFormController: Story = {
  args: {
    label: 'Controlled date and time',
    description: 'This example uses react-hook-form integration.',
  },
  render: function DateTimePickerFieldControllerStory(args) {
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
    label: 'Required date and time',
    description: 'This field is required.',
  },
  render: function DateTimePickerFieldValidationStory(args) {
    const {
      control,
      formState: { errors },
      handleSubmit,
    } = useForm<{ dateTime: string | undefined }>({
      defaultValues: { dateTime: undefined },
    });

    return (
      <form
        onSubmit={handleSubmit(
          (data: { dateTime: string | undefined }): void => {
            if (!data.dateTime) {
              console.error('Validation failed: DateTime is required');
              return;
            }
            console.info('Form submitted with:', data);
          },
        )}
        className="space-y-4"
      >
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
  render: function DateTimePickerMultipleFieldsStory() {
    const [startTime, setStartTime] = useState<string | null>();
    const [endTime, setEndTime] = useState<string | null>();

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
          label="Event start"
          value={startTime}
          onChange={setStartTime}
          calendarProps={{
            disabled: { before: new Date() },
          }}
        />
        <DateTimePickerField
          label="Event end"
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
    label: 'Time selection focus',
    description: 'Pre-set to today, focus on time selection.',
  },
  render: function DateTimePickerTimeOnlyStory(args) {
    const [dateTime, setDateTime] = useState<string | null>(() => {
      const today = new Date();
      today.setHours(9, 0, 0, 0);
      return today.toISOString();
    });

    return (
      <DateTimePickerField
        {...args}
        value={dateTime}
        onChange={setDateTime}
        showSeconds
      />
    );
  },
};
