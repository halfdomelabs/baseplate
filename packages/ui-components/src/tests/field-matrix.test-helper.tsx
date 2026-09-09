import type { ReactElement } from 'react';

import { expect, it } from 'vitest';

import type { FormFieldProps } from '#src/types/form.js';

import { renderWithProviders } from './render.test-helper.js';

/**
 * Every combination of the label, description and error slots a vertical field
 * has to lay out, plus the disabled state. Shared so the snapshots compare like
 * for like across components.
 */
const FIELD_STATES: [state: string, props: FormFieldProps][] = [
  ['label only', { label: 'Label' }],
  ['label and description', { label: 'Label', description: 'Description' }],
  [
    'label, description and error',
    { label: 'Label', description: 'Description', error: 'Error' },
  ],
  ['description without label', { description: 'Description' }],
  ['neither label nor description', {}],
  ['error only', { error: 'Error' }],
  ['disabled', { label: 'Label', description: 'Description', disabled: true }],
];

/**
 * Snapshots a field's DOM across every label/description/error state.
 *
 * These pin what the shared vertical layout produces and what downstream
 * depends on: child order (which decides whether `FieldDescription`'s
 * `nth-last-2:-mt-1` matches), the empty `<label>` and `<p>` rendered for absent
 * slots, `data-invalid` / `data-disabled`, and every `id` / `htmlFor` / `aria-*`
 * attribute.
 *
 * Ids come from `useId`, which derives from the calling component's position in
 * the tree, so each state gets its own `render` — sharing one would make adding
 * a state renumber its neighbours.
 */
export function itSnapshotsTheFieldMatrix(
  renderField: (props: FormFieldProps) => ReactElement,
): void {
  it.each(FIELD_STATES)('%s', (_state, props) => {
    const { container } = renderWithProviders(renderField(props));

    expect(container.innerHTML).toMatchSnapshot();
  });
}
