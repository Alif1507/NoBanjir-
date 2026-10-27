import { z } from "zod";
import { getActor } from "../../../../lib/auth/server.ts";
import { deviceSchema } from "../../../../lib/iot/schema.ts";
import { supabaseRest } from "../../../../lib/supabase/server.ts";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const actor = await getActor(request);
  if (!actor) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (actor.role !== "admin") return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  try {
    const devices = z.array(deviceSchema.extend({ min_ingest_interval_seconds: z.number() })).parse(
      await supabaseRest("devices?select=id,device_code,name,location_description,sensor_to_zero_cm,min_distance_cm,max_distance_cm,max_water_height_cm,waspada_min_cm,siaga_min_cm,bahaya_min_cm,offline_after_seconds,min_ingest_interval_seconds,is_active&order=name&limit=100", true));
    return Response.json({ devices }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "DEVICES_UNAVAILABLE" }, { status: 503 }); }
}
