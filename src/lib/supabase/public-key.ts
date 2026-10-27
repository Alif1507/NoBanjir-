export function isPublicKey(key: string | undefined): boolean {
  if (!key) return false;
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true;
  try {
    const parts = key.split(".");
    if (parts.length !== 3) return false;
    const bytes = Uint8Array.from(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")), char => char.charCodeAt(0));
    const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return !!payload && typeof payload === "object" && "role" in payload && payload.role === "anon";
  } catch { return false; }
}
