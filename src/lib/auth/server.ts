import "server-only";
import { z } from "zod";
import { supabaseRest } from "../supabase/server.ts";
import type { AppRole } from "./permissions.ts";

export type Actor = { id: string; email: string | null; displayName: string; role: AppRole; token: string };
const userSchema = z.object({ id: z.uuid(), email: z.string().nullable().optional() });
const profileSchema = z.object({ display_name: z.string(), role: z.enum(["reporter", "officer", "admin"]) });

export function bearerToken(request: Request) {
  const match = /^Bearer ([A-Za-z0-9._-]+)$/.exec(request.headers.get("authorization") ?? "");
  return match?.[1] ?? null;
}

export async function getActor(request: Request): Promise<Actor | null> {
  const token = bearerToken(request);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !key) return null;
  try {
    const response = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: key, Authorization: `Bearer ${token}` },
      cache: "no-store", signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const user = userSchema.parse(await response.json());
    const profiles = z.array(profileSchema).parse(await supabaseRest(
      `profiles?select=display_name,role&id=eq.${user.id}&limit=1`, true));
    if (!profiles[0]) return null;
    return { id: user.id, email: user.email ?? null,
      displayName: profiles[0].display_name, role: profiles[0].role, token };
  } catch { return null; }
}

export async function userRpc(path: string, token: string, body: object) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_NOT_CONFIGURED");
  return fetch(`${url}/rest/v1/rpc/${path}`, {
    method: "POST", headers: { apikey: key, Authorization: `Bearer ${token}`,
      "Content-Type": "application/json" }, body: JSON.stringify(body),
    cache: "no-store", signal: AbortSignal.timeout(8000),
  });
}
