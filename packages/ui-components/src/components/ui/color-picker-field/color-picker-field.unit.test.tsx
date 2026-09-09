import { describe } from 'vitest';

import { itSnapshotsTheFieldMatrix } from '#src/tests/field-matrix.test-helper.js';

import { ColorPickerField } from './color-picker-field.js';

describe('ColorPickerField DOM structure', () => {
  itSnapshotsTheFieldMatrix((props) => <ColorPickerField {...props} />);
});
