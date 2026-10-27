import { z } from "zod";
import { readingSchema } from "../../../lib/iot/schema.ts";
import { supabaseRest } from "../../../lib/supabase/server.ts";
import { historyStart } from "../../../lib/iot/history.ts";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const deviceId = z.uuid().safeParse(query.get("device_id"));
  const since = historyStart(query.get("range") ?? "1h");
  if (!deviceId.success || !since) {
    return Response.json({ error: "INVALID_QUERY" }, { status: 400 });
  }
  try {
    const filter = `device_id=eq.${deviceId.data}&received_at=gte.${encodeURIComponent(since)}`;
    // Query descending so row limits preserve the most recent observations.
    // Longer ranges may be truncated; return an explicit flag, never imply completeness.
    const result = z.array(readingSchema).parse(await supabaseRest(`sensor_readings?select=*&${filter}&order=received_at.desc,id.desc&limit=1000`));
    return Response.json({ readings: result.reverse(), truncated: result.length === 1000 },
      { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "TELEMETRY_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
