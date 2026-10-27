import { createHash } from "node:crypto";
import { parseTelemetry, storeResultSchema } from "./schema.ts";
import type { TelemetryPacket } from "./schema.ts";

const MAX_BODY_BYTES = 2048;
type Dependencies = {
  store: (tokenHash: string, packet: TelemetryPacket) => Promise<unknown>;
  now?: () => Date;
  allowLocalHttp?: boolean;
};

function json(body: unknown, status: number, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export function createIngestHandler(dependencies: Dependencies) {
  return async function POST(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.protocol !== "https:" && !(dependencies.allowLocalHttp && local)) {
      return json({ error: "HTTPS_REQUIRED" }, 400);
    }
    const authorization = request.headers.get("authorization") ?? "";
    const match = /^Bearer ([A-Za-z0-9_-]{43,128})$/.exec(authorization);
    if (!match) return json({ error: "UNAUTHORIZED" }, 401);
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      return json({ error: "JSON_REQUIRED" }, 415);
    }
    const declaredLength = request.headers.get("content-length");
    if (declaredLength && Number(declaredLength) > MAX_BODY_BYTES) return json({ error: "BODY_TOO_LARGE" }, 413);
    if (!request.body) return json({ error: "INVALID_READING" }, 400);
    let value: unknown;
    const reader = request.body.getReader();
    try {
      let bytes = 0;
      const chunks: Uint8Array[] = [];
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > MAX_BODY_BYTES) {
          await reader.cancel();
          return json({ error: "BODY_TOO_LARGE" }, 413);
        }
        chunks.push(chunk.value);
      }
      const body = new Uint8Array(bytes);
      let offset = 0;
      for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
      value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
    } catch {
      return json({ error: "INVALID_JSON" }, 400);
    } finally {
      reader.releaseLock();
    }
    const parsed = parseTelemetry(value, dependencies.now?.() ?? new Date());
    if (!parsed.success) return json({ error: "INVALID_READING" }, 400);
    const tokenHash = createHash("sha256").update(match[1], "utf8").digest("hex");
    try {
      const result = storeResultSchema.parse(await dependencies.store(tokenHash, parsed.data));
      if (result.status === 201) {
        const { status, ...reading } = result;
        return json({ success: true, ...reading }, status);
      }
      return json({ error: result.error }, result.status,
        result.status === 429 ? { "Retry-After": String(result.retry_after) } : {});
    } catch {
      // Do not leak raw Supabase errors, SQL, input packets, or credentials.
      return json({ error: "INGEST_UNAVAILABLE" }, 503);
    }
  };
}
