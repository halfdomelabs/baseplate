import type { Meta, StoryObj } from '@storybook/react-vite';

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
} satisfies Meta<typeof CodeEditorField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 'const x = 1;',
  },
};

export const Labelled: Story = {
  args: {
    label: 'Code Editor',
    description: 'Enter your JavaScript code here.',
    value: 'function greet(name) {\n  return `Hello, ${name}!`;\n}',
  },
};

export const WithError: Story = {
  args: {
    label: 'Code Editor',
    description: 'Enter your JavaScript code here.',
    value: 'const x = ',
    error: 'Syntax error: unexpected end of input',
  },
};

export const TypeScript: Story = {
  args: {
    label: 'TypeScript Editor',
    description: 'Enter your TypeScript code here.',
    language: 'typescript',
    value: 'interface User {\n  name: string;\n  age: number;\n}',
  },
};

export const ReadOnly: Story = {
  args: {
    label: 'Read-only Code',
    description: 'This code cannot be edited.',
    readOnly: true,
    value: 'const PI = 3.14159;',
  },
};

export const WithPlaceholder: Story = {
  args: {
    label: 'Code Editor',
    placeholder: 'Enter your code here...',
  },
};

export const CustomHeight: Story = {
  args: {
    label: 'Tall Editor',
    height: '300px',
    value:
      '// A longer example\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\nfor (let i = 0; i < 10; i++) {\n  console.log(fibonacci(i));\n}',
  },
};
