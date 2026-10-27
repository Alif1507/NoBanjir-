"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { browserSupabase } from "../lib/supabase/browser.ts";
import type { AppRole } from "../lib/auth/permissions.ts";

export type AppSession = { user: User | null; token: string | null; role: AppRole | null;
  displayName: string | null; ready: boolean };
const empty: AppSession = { user: null, token: null, role: null, displayName: null, ready: false };

export function useSession() {
  const [state, setState] = useState<AppSession>(empty);
  useEffect(() => {
    const client = browserSupabase();
    if (!client) { setState({ ...empty, ready: true }); return; }
    let mounted = true;
    async function refresh() {
      const result = await client!.auth.getSession();
      if (!mounted) return;
      const session = result.data.session;
      if (!session) { setState({ ...empty, ready: true }); return; }
      setState({ user: session.user, token: session.access_token, role: null,
        displayName: null, ready: true });
      try {
        const response = await fetch("/api/me", { headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store" });
        if (!response.ok) return;
        const profile = await response.json() as { role: AppRole; display_name: string };
        if (mounted) setState({ user: session.user, token: session.access_token,
          role: profile.role, displayName: profile.display_name, ready: true });
      } catch { /* Keep the signed-in state; retry on the next auth event. */ }
    }
    void refresh();
    let pending: ReturnType<typeof setTimeout> | null = null;
    const { data } = client.auth.onAuthStateChange(() => {
      // Supabase may still hold the auth lock while invoking this callback.
      if (pending) clearTimeout(pending);
      pending = setTimeout(() => { pending = null; void refresh(); }, 0);
    });
    return () => { mounted = false; if (pending) clearTimeout(pending); data.subscription.unsubscribe(); };
  }, []);
  return state;
}
