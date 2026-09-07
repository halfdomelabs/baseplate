import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '#src/tests/render.test-helper.js';

import { InputField } from './input-field.js';

describe('InputField', () => {
  it('announces the description on the labelled control', () => {
    renderWithProviders(
      <InputField label="Name" description="Your full name" />,
    );

    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription(
      'Your full name',
    );
  });

  it('announces both the description and the error', () => {
    renderWithProviders(
      <InputField label="Name" description="Your full name" error="Required" />,
    );

    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription(
      'Your full name Required',
    );
  });

  it('keeps the label associated when the consumer supplies an id', () => {
    renderWithProviders(
      <InputField id="custom-id" label="Name" description="Your full name" />,
    );

    const input = screen.getByLabelText('Name');
    expect(input).toHaveAttribute('id', 'custom-id');
    expect(input).toHaveAccessibleDescription('Your full name');
  });

  it('keeps a consumer-supplied aria-describedby alongside the generated ids', () => {
    renderWithProviders(
      <>
        <span id="outside-hint">Outside hint</span>
        <InputField
          label="Name"
          aria-describedby="outside-hint"
          description="Your full name"
        />
      </>,
    );

    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription(
      'Outside hint Your full name',
    );
  });

  it('updates the description and aria-invalid as the error comes and goes', () => {
    const { rerender } = renderWithProviders(
      <InputField label="Name" description="Your full name" />,
    );

    expect(screen.getByLabelText('Name')).not.toHaveAttribute(
      'aria-invalid',
      'true',
    );

    rerender(
      <InputField label="Name" description="Your full name" error="Required" />,
    );
    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription(
      'Your full name Required',
    );
    expect(screen.getByLabelText('Name')).toHaveAttribute(
      'aria-invalid',
      'true',
    );

    rerender(<InputField label="Name" description="Your full name" />);
    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription(
      'Your full name',
    );
  });
});
