export function fromGraphqlId(id: string): number {
  try {
    return parseInt(id, 10);
  } catch (err) {
    throw new Error(`Unable to parse ID: ${id}`);
  }
}
