import { z } from "zod";
import { getActor, userRpc } from "../../../../lib/auth/server.ts";
import { isStaff } from "../../../../lib/auth/permissions.ts";
import { parseReportTransition, reportSchema } from "../../../../lib/reports/schema.ts";
import { supabaseRest } from "../../../../lib/supabase/server.ts";
import { readJsonLimited } from "../../../../lib/http/body.ts";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const actor = await getActor(request);
  if (!actor) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const id = z.uuid().safeParse((await context.params).id);
  if (!id.success) return Response.json({ error: "INVALID_ID" }, { status: 400 });
  try {
    const reports = z.array(reportSchema).parse(await supabaseRest(
      `environment_reports?select=*&id=eq.${id.data}&limit=1`, true));
    const report = reports[0];
    if (!report) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    if (report.reporter_id !== actor.id && !isStaff(actor.role)) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    const history = await supabaseRest(`report_status_history?select=id,old_status,new_status,note,created_at&report_id=eq.${id.data}&order=created_at.asc`, true);
    return Response.json({ report, history }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "REPORT_UNAVAILABLE" }, { status: 503 }); }
}

export async function PATCH(request: Request, context: Context) {
  const actor = await getActor(request);
  if (!actor) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!isStaff(actor.role)) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  const id = z.uuid().safeParse((await context.params).id);
  if (!id.success) return Response.json({ error: "INVALID_ID" }, { status: 400 });
  let body: unknown;
  try { body = await readJsonLimited(request, 4096); }
  catch (error) { return Response.json({ error: "INVALID_JSON" }, { status: error instanceof Error && error.message === "BODY_TOO_LARGE" ? 413 : 400 }); }
  const parsed = parseReportTransition(body);
  if (!parsed.success) return Response.json({ error: "INVALID_TRANSITION" }, { status: 400 });
  try {
    const response = await userRpc("transition_report", actor.token,
      { p_report_id: id.data, p_status: parsed.data.status, p_staff_note: parsed.data.staff_note });
    if (!response.ok) return Response.json({ error: "INVALID_TRANSITION" }, { status: response.status === 400 ? 400 : 403 });
    if (await response.json() !== true) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json({ success: true });
  } catch { return Response.json({ error: "REPORT_UPDATE_FAILED" }, { status: 503 }); }
}
