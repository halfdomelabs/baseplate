// adapted from https://github.com/AitoDotAI/json-stringify-pretty-compact
// allows { } to be presented as {} to better mirror prettier formatting

function isObject(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null;
}

function forEach(
  obj: unknown,
  cb: (val: unknown, key: string | number) => void,
): void {
  if (Array.isArray(obj)) {
    // eslint-disable-next-line unicorn/no-array-for-each
    obj.forEach(cb);
  } else if (isObject(obj)) {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      cb(val, key);
    }
  }
}

function getTreeDepth(obj: unknown): number {
  let depth = 0;

  if (Array.isArray(obj) || isObject(obj)) {
    forEach(obj, (val) => {
      if (Array.isArray(val) || isObject(val)) {
        const tmpDepth = getTreeDepth(val);
        if (tmpDepth > depth) {
          depth = tmpDepth;
        }
      }
    });

    return depth + 1;
  }

  return depth;
}

interface StringifyOptions {
  indent?: number | string;
  maxLength?: number;
  maxNesting?: number;
  margins?: boolean;
  arrayMargins?: boolean;
  objectMargins?: boolean;
}

function get<Type extends object, Key extends keyof Type>(
  options: Type,
  name: Key,
  defaultValue: Type[Key],
): Exclude<Type[Key], undefined> {
  return (name in options ? options[name] : defaultValue) as Exclude<
    Type[Key],
    undefined
  >;
}

// Note: This regex matches even invalid JSON strings, but since we’re
// working on the output of `JSON.stringify` we know that only valid strings
// are present (unless the user supplied a weird `options.indent` but in
// that case we don’t care since the output would be invalid anyway).
// This regex has been adjusted to allow replacement of { } and [ ] with {} and []
// to better mirror prettier formatting.
const stringOrChar =
  /("(?:[^\\"]|\\.)*")|[:,]|\{(?!})|(?<!\{)}|\[(?!])|(?<!\[)]/g;

function prettify(
  str: string,
  options: {
    addMargin?: boolean;
    addObjectMargin?: boolean;
    addArrayMargin?: boolean;
  } = {},
): string {
  const tokens: Record<string, string> = {
    '{': '{',
    '}': '}',
    '[': '[',
    ']': ']',
    ',': ', ',
    ':': ': ',
  };

  if (!!options.addMargin || !!options.addObjectMargin) {
    tokens['{'] = '{ ';
    tokens['}'] = ' }';
  }

  if (!!options.addMargin || !!options.addArrayMargin) {
    tokens['['] = '[ ';
    tokens[']'] = ' ]';
  }

  return str.replaceAll(stringOrChar, (match, string) =>
    string ? match : tokens[match],
  );
}

export function stringifyPrettyCompact(
  rootObj: unknown,
  options: StringifyOptions = {},
): string {
  const indent = JSON.stringify([1], null, get(options, 'indent', 2)).slice(
    2,
    -3,
  );
  const addMargin = get(options, 'margins', false);
  const addArrayMargin = get(options, 'arrayMargins', false);
  const addObjectMargin = get(options, 'objectMargins', true);
  const maxLength = indent === '' ? Infinity : get(options, 'maxLength', 80);
  const maxNesting = get(options, 'maxNesting', Infinity);

  return (function stringifyRecursive(obj, currentIndent, reserved): string {
    if (
      obj &&
      typeof obj === 'object' &&
      typeof (obj as { toJSON: unknown }).toJSON === 'function'
    ) {
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
      obj = (obj as { toJSON: () => void }).toJSON();
    }

    const string = JSON.stringify(obj);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (string === undefined) {
      return string;
    }

    const length = maxLength - currentIndent.length - reserved;

    const treeDepth = getTreeDepth(obj);
    if (treeDepth <= maxNesting && string.length <= length) {
      const prettified = prettify(string, {
        addMargin,
        addArrayMargin,
        addObjectMargin,
      });
      if (prettified.length <= length) {
        return prettified;
      }
    }

    if (isObject(obj)) {
      const nextIndent = currentIndent + indent;
      const items = [];
      let delimiters;
      const atEndOfArray = (array: unknown[], index: number): number =>
        index === array.length - 1 ? 0 : 1;

      if (Array.isArray(obj)) {
        for (let index = 0; index < obj.length; index += 1) {
          items.push(
            stringifyRecursive(
              obj[index],
              nextIndent,
              atEndOfArray(obj, index),
            ) || 'null',
          );
        }
        delimiters = '[]';
      } else {
        // eslint-disable-next-line unicorn/no-array-for-each
        Object.keys(obj).forEach((key, index, array) => {
          const keyPart = `${JSON.stringify(key)}: `;
          const value = stringifyRecursive(
            obj[key],
            nextIndent,
            keyPart.length + atEndOfArray(array, index),
          );
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (value !== undefined) {
            items.push(keyPart + value);
          }
        });
        delimiters = '{}';
      }

      if (items.length > 0) {
        return [
          delimiters[0],
          indent + items.join(`,\n${nextIndent}`),
          delimiters[1],
        ].join(`\n${currentIndent}`);
      }
    }

    return string;
  })(rootObj, '', 0);
}
