import { getActor } from "../../../lib/auth/server.ts";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const actor = await getActor(request);
  if (!actor) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  return Response.json({ id: actor.id, email: actor.email, display_name: actor.displayName,
    role: actor.role }, { headers: { "Cache-Control": "no-store" } });
}
