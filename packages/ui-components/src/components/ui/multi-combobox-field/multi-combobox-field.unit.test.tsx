import { describe } from 'vitest';

import { itSnapshotsTheFieldMatrix } from '#src/tests/field-matrix.test-helper.js';

import { MultiComboboxField } from './multi-combobox-field.js';

const OPTIONS = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
];

describe('MultiComboboxField DOM structure', () => {
  itSnapshotsTheFieldMatrix((props) => (
    <MultiComboboxField {...props} options={OPTIONS} />
  ));
});
