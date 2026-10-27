import { z } from "zod";
import { readingSchema } from "../../../lib/iot/schema.ts";
import { supabaseRest } from "../../../lib/supabase/server.ts";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const id = z.uuid().safeParse(new URL(request.url).searchParams.get("device_id"));
  if (!id.success) return Response.json({ error: "INVALID_QUERY" }, { status: 400 });
  try {
    const readings = z.array(readingSchema).parse(await supabaseRest(
      `sensor_readings?select=*&device_id=eq.${id.data}&order=received_at.desc,id.desc&limit=1`));
    return Response.json({ reading: readings[0] ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "TELEMETRY_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
