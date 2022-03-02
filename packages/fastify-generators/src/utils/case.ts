export function lowerCaseFirst(str: string): string {
  if (!str.length) {
    return str;
  }
  return str.charAt(0).toLowerCase() + str.substring(1);
}
