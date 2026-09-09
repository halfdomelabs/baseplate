import type { Meta, StoryObj } from '@storybook/react-vite';

import { createFieldStates } from '#src/stories/field-states.js';

import { CodeEditorField } from './code-editor-field.js';

const meta = {
  title: 'components/CodeEditorField',
  component: CodeEditorField,
  tags: ['autodocs'],
  argTypes: {
    label: { control: { type: 'text' } },
    error: { control: { type: 'text' } },
    description: { control: { type: 'text' } },
    language: {
      control: { type: 'select' },
      options: ['javascript', 'typescript', 'json'],
    },
    height: { control: { type: 'text' } },
    placeholder: { control: { type: 'text' } },
    readOnly: { control: { type: 'boolean' } },
  },
  args: {
    value: 'function greet(name) {\n  return `Hello, ${name}!`;\n}',
  },
} satisfies Meta<typeof CodeEditorField>;

export default meta;
type Story = StoryObj<typeof meta>;

const states = createFieldStates({
  label: 'Code editor',
  description: 'Enter your JavaScript code here.',
  error: 'Syntax error: unexpected end of input.',
});

export const Default: Story = { args: states.Default };
export const WithLabel: Story = { args: states.WithLabel };
export const WithDescription: Story = { args: states.WithDescription };
export const DescriptionWithoutLabel: Story = {
  args: states.DescriptionWithoutLabel,
};
export const WithError: Story = { args: states.WithError };
export const ErrorOnly: Story = { args: states.ErrorOnly };
export const Disabled: Story = { args: states.Disabled };

export const TypeScript: Story = {
  args: {
    label: 'TypeScript editor',
    description: 'Enter your TypeScript code here.',
    language: 'typescript',
    value: 'interface User {\n  name: string;\n  age: number;\n}',
  },
};

export const ReadOnly: Story = {
  args: {
    label: 'Read-only code',
    description: 'This code cannot be edited.',
    readOnly: true,
    value: 'const PI = 3.14159;',
  },
};

export const WithPlaceholder: Story = {
  args: {
    label: 'Code editor',
    placeholder: 'Enter your code here...',
    value: '',
  },
};

export const CustomHeight: Story = {
  args: {
    label: 'Tall editor',
    height: '300px',
    value:
      '// A longer example\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nfor (let i = 0; i < 10; i++) {\n  console.log(fibonacci(i));\n}',
  },
};
