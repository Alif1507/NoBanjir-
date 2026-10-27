"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isPublicKey } from "./public-key.ts";

let client: SupabaseClient | null = null;
export function browserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !isPublicKey(key)) return null;
  client ??= createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true,
    detectSessionInUrl: true } });
  return client;
}
