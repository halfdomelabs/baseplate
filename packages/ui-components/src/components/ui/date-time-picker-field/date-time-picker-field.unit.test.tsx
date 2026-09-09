import { describe } from 'vitest';

import { itSnapshotsTheFieldMatrix } from '#src/tests/field-matrix.test-helper.js';

import { DateTimePickerField } from './date-time-picker-field.js';

describe('DateTimePickerField DOM structure', () => {
  itSnapshotsTheFieldMatrix((props) => <DateTimePickerField {...props} />);
});
