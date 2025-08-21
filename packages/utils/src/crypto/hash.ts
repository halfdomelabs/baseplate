function normalizeContent(
  content: string | ArrayBuffer | Buffer,
): ArrayBuffer | Buffer {
  if (typeof content === 'string') {
    const encoder = new TextEncoder();
    const { buffer } = encoder.encode(content);
    if (!(buffer instanceof ArrayBuffer)) {
      throw new TypeError('Buffer is not an ArrayBuffer');
    }
    return buffer;
  }
  return content;
}

export async function hashWithSHA256(
  content: string | ArrayBuffer | Buffer,
): Promise<string> {
  const data = normalizeContent(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = [...new Uint8Array(hashBuffer)];
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
