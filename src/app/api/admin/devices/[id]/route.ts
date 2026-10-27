import { z } from "zod";
import { getActor } from "../../../../../lib/auth/server.ts";
import { provisionConfigSchema } from "../../../../../lib/iot/provision-config.ts";
import { supabaseRest } from "../../../../../lib/supabase/server.ts";
import { readJsonLimited } from "../../../../../lib/http/body.ts";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  const actor = await getActor(request);
  if (!actor) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (actor.role !== "admin") return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  const id = z.uuid().safeParse((await context.params).id);
  if (!id.success) return Response.json({ error: "INVALID_ID" }, { status: 400 });
  let body: unknown;
  try { body = await readJsonLimited(request, 8192); }
  catch (error) { return Response.json({ error: "INVALID_JSON" }, { status: error instanceof Error && error.message === "BODY_TOO_LARGE" ? 413 : 400 }); }
  const input = z.object({ ...provisionConfigSchema.shape,
    is_active: z.boolean() }).strict().safeParse(body);
  if (!input.success) return Response.json({ error: "INVALID_CONFIG", issues: input.error.flatten().fieldErrors }, { status: 400 });
  const { is_active, ...inputConfig } = input.data;
  const calibrated = provisionConfigSchema.safeParse(inputConfig);
  if (!calibrated.success) return Response.json({ error: "INVALID_CONFIG", issues: calibrated.error.flatten().fieldErrors }, { status: 400 });
  try {
    const rows = z.array(z.object({ device_code: z.string() })).parse(await supabaseRest(
      `devices?select=device_code&id=eq.${id.data}&limit=1`, true));
    if (!rows[0]) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    if (rows[0].device_code !== input.data.device_code) return Response.json({ error: "DEVICE_CODE_IMMUTABLE" }, { status: 400 });
    const { device_code: _code, ...config } = calibrated.data;
    await supabaseRest(`devices?id=eq.${id.data}&select=id`, true, {
      method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ ...config, is_active }),
    });
    return Response.json({ success: true });
  } catch { return Response.json({ error: "DEVICE_UPDATE_FAILED" }, { status: 503 }); }
}
