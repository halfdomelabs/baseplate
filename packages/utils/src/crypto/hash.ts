function normalizeContent(content: string | ArrayBuffer): ArrayBuffer {
  if (typeof content === 'string') {
    const encoder = new TextEncoder();
    return encoder.encode(content);
  }
  return content;
}

export async function hashWithSHA256(
  content: string | ArrayBuffer,
): Promise<string> {
  const data = normalizeContent(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = [...new Uint8Array(hashBuffer)];
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
