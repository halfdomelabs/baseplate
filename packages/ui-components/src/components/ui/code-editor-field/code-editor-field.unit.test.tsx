import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '#src/tests/render.test-helper.js';

import { CodeEditorField } from './code-editor-field.js';

/** The editable element CodeMirror renders inside its wrapper. */
function getContent(): HTMLElement {
  return screen.getByRole('textbox');
}

describe('CodeEditorField', () => {
  it('names and describes the editable element', () => {
    renderWithProviders(
      <CodeEditorField
        label="Schema"
        description="JSON only"
        value="{}"
        language="json"
      />,
    );

    expect(getContent()).toHaveAccessibleName('Schema');
    expect(getContent()).toHaveAccessibleDescription('JSON only');
  });

  it('updates the attributes on error change without losing the content', () => {
    const { rerender } = renderWithProviders(
      <CodeEditorField label="Schema" description="JSON only" value="{}" />,
    );

    expect(getContent()).toHaveAttribute('aria-invalid', 'false');

    rerender(
      <CodeEditorField
        label="Schema"
        description="JSON only"
        value="{}"
        error="Invalid"
      />,
    );

    expect(getContent()).toHaveAttribute('aria-invalid', 'true');
    expect(getContent()).toHaveAccessibleDescription('JSON only Invalid');
    expect(getContent()).toHaveTextContent('{}');
  });
});
