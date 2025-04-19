import { describe, expect, it } from 'vitest';

import { preprocessCodeForExtractionHack } from './preprocess-code-for-extraction-hack.js';

describe('preprocessCodeForExtractionHack', () => {
  // Test Pattern 1: identifier /* TPL_VAR:START */ ( => identifier(/* TPL_VAR:START */
  it('should move START markers inside opening parentheses', () => {
    const input = `
      function doSomething /* TPL_ARGS:START */ (arg1, arg2) {
        return arg1 + arg2;
      }
      
      const result = calculate /* TPL_PARAMS:START */ (a, b, c);
    `;

    const expected = `
      function doSomething(/* TPL_ARGS:START */arg1, arg2) {
        return arg1 + arg2;
      }
      
      const result = calculate(/* TPL_PARAMS:START */a, b, c);
    `;

    const result = preprocessCodeForExtractionHack(input);
    expect(result).toBe(expected);
  });

  // Test Pattern 2: ( /* TPL_VAR:END */ => /* TPL_VAR:END */ (
  it('should move END markers before opening parentheses', () => {
    const input = `
      function process() {
        return (/* TPL_DATA:END */{
          name: 'test',
          value: 42
        });
        
        if (/* TPL_CONDITION:END */x > 0) {
          return true;
        }
      }
    `;

    const expected = `
      function process() {
        return /* TPL_DATA:END */({
          name: 'test',
          value: 42
        });
        
        if /* TPL_CONDITION:END */(x > 0) {
          return true;
        }
      }
    `;

    const result = preprocessCodeForExtractionHack(input);
    expect(result).toBe(expected);
  });

  // Test both patterns together in complex code
  it('should handle both patterns in complex code', () => {
    const input = `
      function complexFunction /* TPL_FUNC:START */ (a, b) {
        const data = ( /* TPL_OBJ:END */ {
          x: a,
          y: b,
          calculate /* TPL_METHOD:START */ (multiplier) {
            return ( /* TPL_RESULT:END */ this.x * this.y * multiplier);
          }
        });
        return data;
      }
    `;

    const expected = `
      function complexFunction(/* TPL_FUNC:START */a, b) {
        const data = /* TPL_OBJ:END */( {
          x: a,
          y: b,
          calculate(/* TPL_METHOD:START */multiplier) {
            return /* TPL_RESULT:END */( this.x * this.y * multiplier);
          }
        });
        return data;
      }
    `;

    const result = preprocessCodeForExtractionHack(input);
    expect(result).toBe(expected);
  });

  // Test with no patterns to transform
  it('should return the same string when no patterns match', () => {
    const input = `
      function regular(param1, param2) {
        return param1 + param2;
      }

      const x = /* TPL_VAR:START */ () => {} */ TPL_VAR:END */
      
      // Some comment /* that looks similar */ but isn't a marker
      const obj = {
        key: 'value'
      };
    `;

    const result = preprocessCodeForExtractionHack(input);
    expect(result).toBe(input);
  });
});
