import { describe } from 'vitest';

import { itSnapshotsTheFieldMatrix } from '#src/tests/field-matrix.test-helper.js';

import { TextareaField } from './textarea-field.js';

describe('TextareaField DOM structure', () => {
  itSnapshotsTheFieldMatrix((props) => <TextareaField {...props} />);
});
