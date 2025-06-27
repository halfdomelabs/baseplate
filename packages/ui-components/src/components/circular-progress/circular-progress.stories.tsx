import type { Meta, StoryObj } from '@storybook/react';

import React from 'react';

import { CircularProgress } from './circular-progress.js';

const meta: Meta<typeof CircularProgress> = {
  title: 'Components/CircularProgress',
  component: CircularProgress,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A circular progress bar component that displays progress as a percentage.',
      },
    },
  },
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'The current progress value',
    },
    max: {
      control: { type: 'number', min: 1 },
      description: 'The maximum value for the progress bar',
    },
    min: {
      control: { type: 'number' },
      description: 'The minimum value for the progress bar',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'The size of the circular progress component',
    },
    gaugePrimaryColor: {
      control: { type: 'color' },
      description: 'Color of the primary progress indicator',
    },
    gaugeSecondaryColor: {
      control: { type: 'color' },
      description: 'Color of the secondary/background progress indicator',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes',
    },
  },
  args: {
    value: 50,
    max: 100,
    min: 0,
    gaugePrimaryColor: 'var(--primary)',
    gaugeSecondaryColor: 'var(--muted)',
  },
};

export default meta;
type Story = StoryObj<typeof CircularProgress>;

export const Default: Story = {
  render: (args) => <CircularProgress {...args} />,
};

export const Empty: Story = {
  name: 'Empty (0%)',
  args: {
    value: 0,
  },
};

export const Complete: Story = {
  name: 'Complete (100%)',
  args: {
    value: 100,
  },
};

export const QuarterProgress: Story = {
  name: 'Quarter Progress (25%)',
  args: {
    value: 25,
  },
};

export const ThreeQuartersProgress: Story = {
  name: 'Three Quarters Progress (75%)',
  args: {
    value: 75,
  },
};

export const CustomColors: Story = {
  args: {
    value: 60,
    gaugePrimaryColor: '#10b981',
    gaugeSecondaryColor: '#e5e7eb',
  },
};

export const CustomRange: Story = {
  name: 'Custom Range (0-200)',
  args: {
    value: 150,
    max: 200,
    min: 0,
  },
};

export const NegativeRange: Story = {
  name: 'Negative Range (-50 to 50)',
  args: {
    value: 25,
    max: 50,
    min: -50,
  },
};

export const MultipleProgressBars: Story = {
  render: () => (
    <div className="flex gap-8">
      <CircularProgress
        value={25}
        max={100}
        min={0}
        gaugePrimaryColor="var(--primary)"
        gaugeSecondaryColor="var(--muted)"
      />
      <CircularProgress
        value={50}
        max={100}
        min={0}
        gaugePrimaryColor="var(--primary)"
        gaugeSecondaryColor="var(--muted)"
      />
      <CircularProgress
        value={75}
        max={100}
        min={0}
        gaugePrimaryColor="var(--primary)"
        gaugeSecondaryColor="var(--muted)"
      />
      <CircularProgress
        value={100}
        max={100}
        min={0}
        gaugePrimaryColor="var(--primary)"
        gaugeSecondaryColor="var(--muted)"
      />
    </div>
  ),
};

export const DifferentSizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <CircularProgress
        value={60}
        max={100}
        min={0}
        gaugePrimaryColor="var(--primary)"
        gaugeSecondaryColor="var(--muted)"
        size="sm"
      />
      <CircularProgress
        value={60}
        max={100}
        min={0}
        gaugePrimaryColor="var(--primary)"
        gaugeSecondaryColor="var(--muted)"
        size="md"
      />
      <CircularProgress
        value={60}
        max={100}
        min={0}
        gaugePrimaryColor="var(--primary)"
        gaugeSecondaryColor="var(--muted)"
        size="lg"
      />
    </div>
  ),
};

export const AnimatedProgress: Story = {
  render: () => {
    const [progress, setProgress] = React.useState(0);

    React.useEffect(() => {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            return 0;
          }
          return prev + 10;
        });
      }, 500);

      return () => {
        clearInterval(timer);
      };
    }, []);

    return (
      <CircularProgress
        value={progress}
        max={100}
        min={0}
        gaugePrimaryColor="var(--primary)"
        gaugeSecondaryColor="var(--muted)"
      />
    );
  },
};
