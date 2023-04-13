export function underscoreToTitleCase(str: string): string {
  // Split the string into an array of words
  const words = str.split('_');

  // Capitalize the first letter of each word and join them back together
  const titleCase = words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return titleCase;
}
