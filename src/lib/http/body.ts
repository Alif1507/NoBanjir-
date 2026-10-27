export async function readBytesLimited(request: Request, limit: number) {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > limit) throw new Error("BODY_TOO_LARGE");
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  let length = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const result = await reader.read();
      if (result.done) break;
      length += result.value.byteLength;
      if (length > limit) { await reader.cancel(); throw new Error("BODY_TOO_LARGE"); }
      chunks.push(result.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

export async function readJsonLimited(request: Request, limit: number): Promise<unknown> {
  const bytes = await readBytesLimited(request, limit);
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

export async function readFormDataLimited(request: Request, limit: number) {
  const bytes = await readBytesLimited(request, limit);
  const copy = new Request(request.url, { method: "POST", headers: request.headers,
    body: new Blob([bytes.buffer as ArrayBuffer]) });
  return copy.formData();
}
