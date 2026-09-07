import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '#src/tests/render.test-helper.js';

import { MultiSwitchField } from './multi-switch-field.js';

const options = [
  { label: 'Email', value: 'email' },
  { label: 'SMS', value: 'sms' },
];

describe('MultiSwitchField', () => {
  it('names and describes the group of switches', () => {
    renderWithProviders(
      <MultiSwitchField
        label="Channels"
        description="How we reach you"
        options={options}
        value={[]}
      />,
    );

    const group = screen.getByRole('group', { name: 'Channels' });
    expect(group).toHaveAccessibleDescription('How we reach you');
  });

  it('puts a consumer-supplied id on the group so it can be referenced', () => {
    renderWithProviders(
      <MultiSwitchField
        id="channels"
        label="Channels"
        options={options}
        value={[]}
      />,
    );

    expect(screen.getByRole('group', { name: 'Channels' })).toHaveAttribute(
      'id',
      'channels',
    );
  });
});
