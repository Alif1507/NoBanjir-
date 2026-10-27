import { z } from "zod";
import { deviceSchema } from "../../../lib/iot/schema.ts";
import { supabaseRest } from "../../../lib/supabase/server.ts";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const select = "id,device_code,name,location_description,sensor_to_zero_cm,min_distance_cm,max_distance_cm,max_water_height_cm,waspada_min_cm,siaga_min_cm,bahaya_min_cm,offline_after_seconds,is_active";
    const devices = z.array(deviceSchema).parse(await supabaseRest(`devices?select=${select}&is_active=eq.true&order=name&limit=100`));
    return Response.json({ devices }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "TELEMETRY_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
