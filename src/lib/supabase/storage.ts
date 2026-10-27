import "server-only";

export async function storageRequest(path: string, init: RequestInit = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("SUPABASE_NOT_CONFIGURED");
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  if (!key.startsWith("sb_")) headers.set("Authorization", `Bearer ${key}`);
  return fetch(`${url}/storage/v1/object/report-photos/${path}`, {
    ...init, headers, cache: "no-store", signal: AbortSignal.timeout(15000),
  });
}
