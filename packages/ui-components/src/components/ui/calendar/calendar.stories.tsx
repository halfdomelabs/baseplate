import type { Meta, StoryObj } from '@storybook/react-vite';
import type { DateRange } from 'react-day-picker';

import { useState } from 'react';

import { Calendar } from './calendar.js';

const meta = {
  title: 'components/Calendar',
  component: Calendar,
  tags: ['autodocs'],
  argTypes: {
    buttonVariant: {
      control: 'select',
      options: [
        'default',
        'secondary',
        'destructive',
        'outline',
        'ghost',
        'link',
      ],
    },
    showOutsideDays: {
      control: 'boolean',
    },
    captionLayout: {
      control: 'select',
      options: ['label', 'dropdown'],
    },
  },
  args: {
    showOutsideDays: true,
    captionLayout: 'label',
    buttonVariant: 'ghost',
    mode: 'single',
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const SingleSelection: Story = {
  args: {
    mode: 'single',
    captionLayout: 'dropdown',
  },
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return (
      <Calendar
        {...args}
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border shadow-sm"
      />
    );
  },
};

export const MultipleSelection: Story = {
  args: {
    mode: 'multiple',
  },
  render: (args) => {
    const [dates, setDates] = useState<Date[]>();
    return (
      <Calendar
        {...args}
        mode="multiple"
        selected={dates}
        onSelect={setDates}
        className="rounded-md border shadow-sm"
      />
    );
  },
};

export const RangeSelection: Story = {
  args: {
    mode: 'range',
  },
  render: (args) => {
    const [range, setRange] = useState<DateRange>();
    return (
      <Calendar
        {...args}
        mode="range"
        selected={range}
        onSelect={setRange}
        className="rounded-md border shadow-sm"
      />
    );
  },
};

export const DropdownLayout: Story = {
  args: {
    captionLayout: 'dropdown',
  },
};

export const HideOutsideDays: Story = {
  args: {
    showOutsideDays: false,
  },
};

export const WithWeekNumbers: Story = {
  args: {
    showWeekNumber: true,
  },
};

export const WithFixedWeeks: Story = {
  args: {
    fixedWeeks: true,
  },
};

export const WithDisabledDates: Story = {
  args: {
    disabled: [
      { before: new Date() },
      { after: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, // 30 days from now
    ],
  },
};
