import { createIngestHandler } from "../../../../lib/iot/ingest.ts";
import { storeReading } from "../../../../lib/supabase/server.ts";

export const runtime = "nodejs";
export const POST = createIngestHandler({ store: storeReading,
  allowLocalHttp: process.env.NODE_ENV !== "production" });
