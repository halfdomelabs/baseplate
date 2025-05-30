import type { Meta, StoryObj } from '@storybook/react';
import type { UseFormReturn } from 'react-hook-form';

import { useState } from 'react';

import { Button } from '../Button/Button.js';
import { Input } from '../Input/Input.js';
import { Label } from '../Label/Label.js';
import { FormActionBar } from './FormActionBar.js';

const meta = {
  component: FormActionBar,
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Whether the form actions should be disabled',
    },
  },
  decorators: [
    (Story) => (
      <div className="relative min-h-[200px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FormActionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: () => {
    const mockForm = {
      reset: () => { alert('Form reset!'); },
      formState: {
        isDirty: true,
        isSubmitting: false,
      },
    };
    return <FormActionBar form={mockForm as unknown as UseFormReturn} />;
  },
};

export const Clean: Story = {
  args: {},
  render: () => {
    const mockForm = {
      reset: () => { alert('Form reset!'); },
      formState: {
        isDirty: false,
        isSubmitting: false,
      },
    };
    return <FormActionBar form={mockForm as unknown as UseFormReturn} />;
  },
};

export const Submitting: Story = {
  args: {},
  render: () => {
    const mockForm = {
      reset: () => { alert('Form reset!'); },
      formState: {
        isDirty: true,
        isSubmitting: true,
      },
    };
    return <FormActionBar form={mockForm as unknown as UseFormReturn} />;
  },
};

export const Disabled: Story = {
  args: {},
  render: () => (
    <FormActionBar
      disabled={true}
      onReset={() => { alert('Reset clicked!'); }}
    />
  ),
};

export const CustomActions: Story = {
  args: {},
  render: () => {
    const mockForm = {
      reset: () => { alert('Form reset!'); },
      formState: {
        isDirty: true,
        isSubmitting: false,
      },
    };
    return (
      <FormActionBar form={mockForm as unknown as UseFormReturn}>
        <Button variant="outline" size="sm" type="button">
          Cancel
        </Button>
        <Button variant="destructive" size="sm" type="button">
          Delete
        </Button>
        <div className="flex-1" />
        <Button variant="default" size="sm" type="submit">
          Save & Continue
        </Button>
      </FormActionBar>
    );
  },
};

export const InteractiveForm: Story = {
  args: {},
  render: () => {
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [originalData] = useState({ name: '', email: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isDirty =
      formData.name !== originalData.name ||
      formData.email !== originalData.email;

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();
      setIsSubmitting(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsSubmitting(false);
      alert('Form submitted!');
    };

    const handleReset = (): void => {
      setFormData(originalData);
    };

    return (
      <form onSubmit={handleSubmit} className="relative min-h-[300px]">
        <div className="space-y-4 p-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                { setFormData({ ...formData, name: e.target.value }); }
              }
              placeholder="Enter your name"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                { setFormData({ ...formData, email: e.target.value }); }
              }
              placeholder="Enter your email"
            />
          </div>
        </div>
        <FormActionBar
          form={{
            reset: handleReset,
            formState: { isDirty, isSubmitting },
          } as unknown as UseFormReturn}
        />
      </form>
    );
  },
};

export const WithReactHookForm: Story = {
  args: {},
  render: () => {
    // This is a mock example showing how it would work with react-hook-form
    const mockForm = {
      reset: () => { 
        alert('Form reset!');
      },
      formState: {
        isDirty: true,
        isSubmitting: false,
      },
    };

    return (
      <div className="relative">
        <div className="p-4">
          <p className="text-sm text-muted-foreground">
            This example shows how FormActionBar integrates directly with
            react-hook-form:
          </p>
          <pre className="mt-4 rounded bg-muted p-4 text-xs">
            {`// Simply pass your form instance
<FormActionBar form={form} />

// Or with custom reset handler
<FormActionBar 
  form={form} 
  onReset={() => {
    // Custom logic before reset
    form.reset();
  }}
/>`}
          </pre>
        </div>
        <FormActionBar form={mockForm as unknown as UseFormReturn} />
      </div>
    );
  },
};