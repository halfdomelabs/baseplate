import path from 'node:path';

/**
 * Safely joins paths ensuring the result is always within the parent directory.
 * This prevents directory traversal attacks by resolving the path and checking
 * that it remains within the parent directory boundaries.
 *
 * @param parentDir - The parent directory that the result must be within
 * @param ...segments - Path segments to join to the parent directory
 * @returns The joined path that is guaranteed to be within the parent directory
 * @throws Error if the resulting path would be outside the parent directory
 *
 * @example
 * ```ts
 * // Valid paths
 * safePathJoin('/home/user', 'documents', 'file.txt')
 * // Returns: '/home/user/documents/file.txt'
 *
 * // Throws error - attempts to escape parent directory
 * safePathJoin('/home/user', '../../../etc/passwd')
 * // Throws: Error: Path traversal detected
 *
 * // Handles complex paths safely
 * safePathJoin('/home/user', 'docs/../documents/./file.txt')
 * // Returns: '/home/user/documents/file.txt'
 * ```
 */
export function safePathJoin(parentDir: string, ...segments: string[]): string {
  // Normalize the parent directory to handle any . or .. in it
  const normalizedParent = path.resolve(parentDir);

  // Check for absolute paths in segments (which would escape the parent)
  for (const segment of segments) {
    if (path.isAbsolute(segment)) {
      throw new Error(
        `Path traversal detected: Absolute path segment "${segment}" is not allowed`,
      );
    }
  }

  // Join all segments together
  const joined = path.join(normalizedParent, ...segments);

  // Resolve to get the absolute path
  const resolved = path.resolve(joined);

  // Special case for root directory
  if (normalizedParent === path.sep || normalizedParent === path.resolve('/')) {
    // When parent is root, we need to check if we're trying to go above root
    if (
      resolved !== normalizedParent &&
      !resolved.startsWith(normalizedParent)
    ) {
      throw new Error(
        `Path traversal detected: Cannot navigate outside root directory`,
      );
    }
    return resolved;
  }

  // Check if the resolved path is within the parent directory
  // Add path separator to ensure exact directory match (not just prefix match)
  const parentWithSep = normalizedParent.endsWith(path.sep)
    ? normalizedParent
    : normalizedParent + path.sep;

  // Special case: if resolved is exactly the parent directory
  if (resolved === normalizedParent) {
    return resolved;
  }

  // Check if resolved path starts with parent directory
  if (!resolved.startsWith(parentWithSep)) {
    throw new Error(
      `Path traversal detected: Resolved path "${resolved}" is outside parent directory "${normalizedParent}"`,
    );
  }

  return resolved;
}
