import { z } from "zod";
import { getActor } from "../../../../../lib/auth/server.ts";
import { isStaff } from "../../../../../lib/auth/permissions.ts";
import { photoExtension, validPhotoBytes } from "../../../../../lib/reports/photo.ts";
import { reportSchema } from "../../../../../lib/reports/schema.ts";
import { supabaseRest } from "../../../../../lib/supabase/server.ts";
import { storageRequest } from "../../../../../lib/supabase/storage.ts";
import { readFormDataLimited } from "../../../../../lib/http/body.ts";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

async function authorizedReport(request: Request, context: Context) {
  const actor = await getActor(request);
  const id = z.uuid().safeParse((await context.params).id);
  if (!actor || !id.success) return null;
  const rows = z.array(reportSchema).parse(await supabaseRest(
    `environment_reports?select=*&id=eq.${id.data}&limit=1`, true));
  const report = rows[0];
  if (!report || (report.reporter_id !== actor.id && !isStaff(actor.role))) return null;
  return { actor, report };
}

export async function GET(request: Request, context: Context) {
  try {
    const found = await authorizedReport(request, context);
    if (!found || !found.report.photo_path) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    const response = await storageRequest(found.report.photo_path);
    if (!response.ok) return Response.json({ error: "PHOTO_UNAVAILABLE" }, { status: 503 });
    return new Response(response.body, { headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/octet-stream",
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return Response.json({ error: "PHOTO_UNAVAILABLE" }, { status: 503 }); }
}

export async function POST(request: Request, context: Context) {
  if (Number(request.headers.get("content-length")) > 6 * 1024 * 1024) {
    return Response.json({ error: "PHOTO_TOO_LARGE" }, { status: 413 });
  }
  try {
    const found = await authorizedReport(request, context);
    if (!found) return Response.json({ error: "UNAUTHORIZED" }, { status: 403 });
    if (found.report.reporter_id !== found.actor.id || found.report.photo_path) {
      return Response.json({ error: "PHOTO_NOT_ALLOWED" }, { status: 403 });
    }
    const form = await readFormDataLimited(request, 6 * 1024 * 1024);
    const file = form.get("photo");
    if (!(file instanceof File)) return Response.json({ error: "PHOTO_REQUIRED" }, { status: 400 });
    const ext = photoExtension(file.type, file.size);
    if (!ext) return Response.json({ error: "PHOTO_INVALID" }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!validPhotoBytes(file.type, bytes)) return Response.json({ error: "PHOTO_INVALID" }, { status: 400 });
    const path = `${found.actor.id}/${found.report.id}/${crypto.randomUUID()}.${ext}`;
    const upload = await storageRequest(path, { method: "POST", headers: { "Content-Type": file.type,
      "x-upsert": "false" }, body: file });
    if (!upload.ok) return Response.json({ error: "PHOTO_UPLOAD_FAILED" }, { status: 503 });
    try {
      const updated = await supabaseRest(`environment_reports?id=eq.${found.report.id}&photo_path=is.null&select=id`, true, {
        method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ photo_path: path }),
      });
      if (!z.array(z.object({ id: z.uuid() })).parse(updated).length) throw new Error("PHOTO_UPDATE_CONFLICT");
    } catch {
      await storageRequest(path, { method: "DELETE" }).catch(() => null);
      return Response.json({ error: "PHOTO_UPDATE_FAILED" }, { status: 503 });
    }
    return Response.json({ success: true }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error && error.message === "BODY_TOO_LARGE" ? "PHOTO_TOO_LARGE" : "PHOTO_UPLOAD_FAILED" },
    { status: error instanceof Error && error.message === "BODY_TOO_LARGE" ? 413 : 503 }); }
}
