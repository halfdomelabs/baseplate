import { describe } from 'vitest';

import { itSnapshotsTheFieldMatrix } from '#src/tests/field-matrix.test-helper.js';

import { ComboboxField } from './combobox-field.js';

const OPTIONS = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
];

describe('ComboboxField DOM structure', () => {
  itSnapshotsTheFieldMatrix((props) => (
    <ComboboxField {...props} options={OPTIONS} />
  ));
});
