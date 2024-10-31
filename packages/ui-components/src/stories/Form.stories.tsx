import type { Meta, StoryObj } from '@storybook/react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  Button,
  CheckboxField,
  ColorPickerField,
  ComboboxField,
  InputField,
  MultiComboboxField,
  SelectField,
  SwitchField,
  TextareaField,
  Toaster,
} from '../components';

// Define the schema using Zod for validation
const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().min(1, 'Color is required'),
  subscribe: z.boolean().refine((bool) => bool, {
    message: 'Subscribe is required',
  }),
  description: z.string().min(10, 'Provide at least 10 characters').optional(),
  category: z
    .enum(['Option 1', 'Option 2', 'Option 3'])
    .refine((val) => val === 'Option 1', {
      message: 'Option 1 must be selected',
    }),
  notifications: z.boolean().refine((bool) => bool, {
    message: 'Notifications is required',
  }),
  singleOption: z.string().min(1, 'Please select an option'),
  multiOptions: z.array(z.string()).min(1, 'Please select at least one option'),
});

type FormData = z.infer<typeof schema>;

function Form({
  onSubmit: onSubmitProp,
}: {
  onSubmit?: (data: unknown) => void;
}): JSX.Element {
  const defaultValues = {
    name: '',
    color: '',
    subscribe: true,
    description: '',
    category: 'Option 1',
    notifications: true,
    singleOption: '',
    multiOptions: [],
  } satisfies FormData;
  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (data) => {
    onSubmitProp?.(data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success('Form submitted!');
    reset(defaultValues);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <InputField.Controller name="name" label="Name" control={control} />

      <ColorPickerField.Controller
        name="color"
        label="Pick a Color"
        control={control}
      />

      <SelectField.Controller
        name="category"
        label="Select Category"
        control={control}
        options={[
          { value: 'Option 1', label: 'Option 1' },
          { value: 'Option 2', label: 'Option 2' },
          { value: 'Option 3', label: 'Option 3' },
        ]}
      />

      <CheckboxField.Controller
        name="subscribe"
        label="Subscribe to Newsletter"
        control={control}
      />

      <TextareaField.Controller
        name="description"
        label="Description"
        control={control}
      />

      <SwitchField.Controller
        name="notifications"
        label="Enable Notifications"
        control={control}
      />

      <ComboboxField.Controller
        name="singleOption"
        label="Choose an Option"
        control={control}
        options={[
          { value: 'Option A', label: 'Option A' },
          { value: 'Option B', label: 'Option B' },
          { value: 'Option C', label: 'Option C' },
        ]}
      />

      <MultiComboboxField.Controller
        name="multiOptions"
        label="Select Multiple Options"
        control={control}
        options={[
          { value: 'Option 1', label: 'Option 1' },
          { value: 'Option 2', label: 'Option 2' },
          { value: 'Option 3', label: 'Option 3' },
          { value: 'Option 4', label: 'Option 4' },
        ]}
      />

      <Button type="submit" disabled={isSubmitting}>
        Submit
      </Button>
      <Toaster />
    </form>
  );
}

const meta: Meta<typeof Form> = {
  title: 'Form',
  component: Form,
  tags: ['!autodocs'],
};

export default meta;

export const FormStory: StoryObj = {
  name: 'Form',
  render: () => <Form />,
};
