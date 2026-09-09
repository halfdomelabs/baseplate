import { describe } from 'vitest';

import { itSnapshotsTheFieldMatrix } from '#src/tests/field-matrix.test-helper.js';

import { SelectField } from './select-field.js';

const OPTIONS = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
];

describe('SelectField DOM structure', () => {
  itSnapshotsTheFieldMatrix((props) => (
    <SelectField {...props} options={OPTIONS} />
  ));
});
