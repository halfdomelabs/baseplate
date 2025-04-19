/**
 * PREPROCESSING HACK: Adjusts code string before template extraction
 * to handle specific Prettier formatting quirks where comment markers
 * are moved outside parentheses.
 *
 * Pattern 1: identifier /* TPL_VAR:START *\/ ( => identifier(/* TPL_VAR:START *\/
 * Pattern 2: ) /* TPL_VAR:END *\/ => /* TPL_VAR:END *\/)
 *
 * WARNING: This is a temporary workaround and might be fragile.
 * It assumes specific formatting outputs from Prettier.
 *
 * @param code The code string to preprocess.
 * @returns The transformed code string.
 */
export function preprocessCodeForExtractionHack(code: string): string {
  let transformedCode = code;

  // --- Pattern 1: Move START marker inside the opening parenthesis ---
  // Addresses Prettier moving the START marker *before* the opening parenthesis.
  // Example `Before`: myFunction /* TPL_ARGS:START */ (arg1, arg2)
  // Example `After`:  myFunction(/* TPL_ARGS:START */ arg1, arg2)
  const startMarkerRegex = /(\w+)\s*(\/\* (TPL_[A-Z0-9_]+):START \*\/)\s*\(/g;
  transformedCode = transformedCode.replaceAll(
    startMarkerRegex,
    (match, identifier, startMarkerComment) =>
      // Replace with: identifier, opening parenthesis, the START comment
      `${identifier}(${startMarkerComment}`,
  );

  // --- Pattern 2: Move END marker before the opening parenthesis ---
  // Addresses cases where the END marker might appear *after* the opening parenthesis,
  // potentially separated by whitespace.
  // Example `Before`: ( /* TPL_ARGS:END */ arg1, arg2)
  // Example `After`:  /* TPL_ARGS:END */ (arg1, arg2)
  const endMarkerRegex = /\(\s*(\/\* (TPL_[A-Z0-9_]+):END \*\/)/g;
  transformedCode = transformedCode.replaceAll(
    endMarkerRegex,
    (match, endMarkerComment) =>
      // Replace with: the END comment, opening parenthesis
      `${endMarkerComment}(`,
  );

  return transformedCode;
}
