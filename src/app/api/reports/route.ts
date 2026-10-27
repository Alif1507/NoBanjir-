import { z } from "zod";
import { getActor } from "../../../lib/auth/server.ts";
import { isStaff } from "../../../lib/auth/permissions.ts";
import { reportSchema, parseReport } from "../../../lib/reports/schema.ts";
import { supabaseRest } from "../../../lib/supabase/server.ts";
import { readJsonLimited } from "../../../lib/http/body.ts";

export const dynamic = "force-dynamic";
const publicFields = "id,category,status,created_at,updated_at";
const privateFields = "id,category,location_text,description,status,created_at,updated_at,reporter_id,photo_path,staff_note";

export async function GET(request: Request) {
  const scope = new URL(request.url).searchParams.get("scope") ?? "public";
  if (!["public", "mine", "staff"].includes(scope)) return Response.json({ error: "INVALID_SCOPE" }, { status: 400 });
  const actor = scope === "public" ? null : await getActor(request);
  if (scope !== "public" && !actor) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (scope === "staff" && !isStaff(actor?.role)) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  try {
    const filter = scope === "mine" ? `&reporter_id=eq.${actor!.id}` : "";
    const select = scope === "public" ? publicFields : privateFields;
    const data = await supabaseRest(`environment_reports?select=${select}${filter}&order=created_at.desc&limit=100`, true);
    return Response.json({ reports: z.array(reportSchema).parse(data) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "REPORTS_UNAVAILABLE" }, { status: 503 }); }
}

export async function POST(request: Request) {
  const actor = await getActor(request);
  if (!actor) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  let input: unknown;
  try { input = await readJsonLimited(request, 8192); }
  catch (error) { return Response.json({ error: error instanceof Error && error.message === "BODY_TOO_LARGE" ? "TOO_LARGE" : "INVALID_JSON" },
    { status: error instanceof Error && error.message === "BODY_TOO_LARGE" ? 413 : 400 }); }
  const parsed = parseReport(input);
  if (!parsed.success) return Response.json({ error: "INVALID_REPORT", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  try {
    const result = await supabaseRest(`environment_reports?select=${privateFields}`, true, {
      method: "POST", headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...parsed.data, reporter_id: actor.id }),
    });
    const report = z.array(reportSchema).parse(result)[0];
    if (!report) throw new Error("MISSING_REPORT");
    return Response.json({ report }, { status: 201 });
  } catch { return Response.json({ error: "REPORT_SAVE_FAILED_OR_RATE_LIMITED" }, { status: 503 }); }
}
