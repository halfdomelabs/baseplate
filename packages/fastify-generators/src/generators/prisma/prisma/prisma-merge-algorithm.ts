import type { StringMergeAlgorithm } from '@baseplate-dev/sync';
import type { formatSchema } from '@prisma/internals';

import { diff3MergeAlgorithm } from '@baseplate-dev/sync';
import { createRequire } from 'node:module';

const internalRequire = createRequire(import.meta.url);

/**
 * Normalize Prisma whitespace by collapsing alignment spaces/tabs while
 * preserving content inside quoted strings and comments.
 *
 * Prisma's formatter aligns field columns, so adding a long field name reflowing
 * an entire block's spacing. Normalizing before diff3 removes this noise.
 *
 * Handles all comment and string forms from the Prisma grammar:
 *   - doc_comment (///)     — preserved verbatim to end of line
 *   - comment (//)          — preserved verbatim to end of line
 *   - multi_line_comment (/* ... *\/) — preserved verbatim across lines
 *   - string_literal ("...") — preserved verbatim including escape sequences
 *   - WHITESPACE (space | tab) — runs collapsed to a single space
 */
export function normalizePrismaWhitespace(text: string): string {
  let result = '';
  let i = 0;
  let prevWasSpace = false;

  while (i < text.length) {
    const ch = text[i];

    // Newline: reset spacing state and emit as-is
    if (ch === '\n' || ch === '\r') {
      // Trim trailing whitespace already accumulated on the current line by
      // stripping any trailing space we may have emitted before this newline.
      result = result.trimEnd();
      result += ch;
      // Handle \r\n as a single newline
      if (ch === '\r' && text[i + 1] === '\n') {
        result += '\n';
        i += 2;
      } else {
        i++;
      }
      prevWasSpace = false;
      continue;
    }

    // Multi-line comment: /* ... */ — preserve verbatim
    if (ch === '/' && text[i + 1] === '*') {
      prevWasSpace = false;
      const end = text.indexOf('*/', i + 2);
      if (end === -1) {
        // Unclosed comment — emit the rest of the text unchanged
        result += text.slice(i);
        break;
      }
      result += text.slice(i, end + 2);
      i = end + 2;
      continue;
    }

    // Line comments (/// doc comment or // regular comment) — preserve to end of line
    if (ch === '/' && text[i + 1] === '/') {
      prevWasSpace = false;
      const lineEnd = text.indexOf('\n', i);
      const commentEnd = lineEnd === -1 ? text.length : lineEnd;
      result += text.slice(i, commentEnd).trimEnd();
      i = commentEnd;
      continue;
    }

    // Quoted string literal — preserve verbatim including escape sequences
    if (ch === '"') {
      prevWasSpace = false;
      result += ch;
      i++;
      while (i < text.length) {
        const inner = text[i];
        // Stop at newline (malformed string, but don't cross line boundaries)
        if (inner === '\n' || inner === '\r') break;
        result += inner;
        i++;
        if (inner === '\\') {
          // Escaped character — include next char unconditionally
          if (i < text.length && text[i] !== '\n' && text[i] !== '\r') {
            result += text[i];
            i++;
          }
        } else if (inner === '"') {
          break;
        }
      }
      continue;
    }

    // Collapse runs of spaces and tabs (WHITESPACE in Prisma grammar) to a single space
    if (ch === ' ' || ch === '\t') {
      if (!prevWasSpace) {
        result += ' ';
        prevWasSpace = true;
      }
      i++;
      continue;
    }

    prevWasSpace = false;
    result += ch;
    i++;
  }

  // Trim any trailing whitespace on the last line (no trailing newline to trigger it)
  return result.trimEnd();
}

/**
 * A merge algorithm for Prisma schema files that normalizes whitespace before
 * running diff3, then re-formats the result with prisma format.
 *
 * This avoids false conflicts caused by Prisma's column-aligning formatter:
 * adding a long field name reflowing alignment in one block would otherwise
 * cause diff3 to conflict with unrelated user edits in a different block.
 */
export const prismaMergeAlgorithm: StringMergeAlgorithm = async (input) => {
  try {
    const { formatSchema: format } = internalRequire('@prisma/internals') as {
      formatSchema: typeof formatSchema;
    };

    const normalizedInput = {
      ...input,
      previousWorkingText: normalizePrismaWhitespace(input.previousWorkingText),
      currentGeneratedText: normalizePrismaWhitespace(
        input.currentGeneratedText,
      ),
      previousGeneratedText: normalizePrismaWhitespace(
        input.previousGeneratedText,
      ),
    };

    const diff3Result = await diff3MergeAlgorithm(normalizedInput);

    // If normalized diff3 couldn't merge or found a conflict, return null so the
    // composite chain falls back to plain diff3 on the original formatted inputs.
    // This ensures conflict markers are shown against properly-formatted Prisma text.
    if (!diff3Result || diff3Result.hasConflict) {
      return null;
    }

    // Re-format the merged result to restore canonical Prisma alignment
    const [[, formattedText]] = await format({
      schemas: [[input.filePath, diff3Result.mergedText]],
    });

    return {
      mergedText: `${formattedText.trimEnd()}\n`,
      hasConflict: false,
    };
  } catch {
    // Fall back to the next algorithm in the composite chain
    return null;
  }
};
