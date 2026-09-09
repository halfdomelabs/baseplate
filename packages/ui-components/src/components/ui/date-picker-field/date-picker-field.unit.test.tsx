import { describe } from 'vitest';

import { itSnapshotsTheFieldMatrix } from '#src/tests/field-matrix.test-helper.js';

import { DatePickerField } from './date-picker-field.js';

describe('DatePickerField DOM structure', () => {
  itSnapshotsTheFieldMatrix((props) => <DatePickerField {...props} />);
});
