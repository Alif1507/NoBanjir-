"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "../hooks/use-session.ts";
import { isStaff, canTransition } from "../lib/auth/permissions.ts";
import { categoryLabels, reportSchema, statusLabels, type EnvironmentReport } from "../lib/reports/schema.ts";

type History = { id: string; old_status: string; new_status: string; note: string | null; created_at: string };
export function ReportDetail() {
  const params = useParams<{ id: string }>();
  const session = useSession();
  const [report, setReport] = useState<EnvironmentReport | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    if (!session.token) return;
    const controller = new AbortController();
    fetch(`/api/reports/${params.id}`, { headers: { Authorization: `Bearer ${session.token}` }, signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error("Laporan tidak tersedia atau akses ditolak."); return response.json(); })
      .then(data => { if (!controller.signal.aborted) { setReport(reportSchema.parse(data.report)); setHistory(data.history); } })
      .catch(() => { if (!controller.signal.aborted) setError("Laporan tidak tersedia atau akses ditolak."); });
    return () => controller.abort();
  }, [session.token, params.id, reload]);
  useEffect(() => {
    if (!report?.photo_path || !session.token) return;
    let url: string | null = null;
    let cancelled = false;
    fetch(`/api/reports/${report.id}/photo`, { headers: { Authorization: `Bearer ${session.token}` } })
      .then(response => response.ok ? response.blob() : null).then(blob => {
        if (blob && !cancelled) { url = URL.createObjectURL(blob); setPhotoUrl(url); }
      }).catch(() => null);
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [report?.id, report?.photo_path, session.token]);
  async function transition(status: "DIPROSES" | "SELESAI" | "DITOLAK") {
    if (!session.token || !report) return;
    setBusy(true); setError("");
    const response = await fetch(`/api/reports/${report.id}`, { method: "PATCH",
      headers: { Authorization: `Bearer ${session.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status, staff_note: note }) }).catch(() => null);
    if (!response?.ok) setError("Perubahan status gagal. Periksa alur status dan catatan petugas.");
    else { setNote(""); setReload(v => v+1); }
    setBusy(false);
  }
  if (session.ready && !session.user) return <p className="empty-state">Silakan <Link href="/login">masuk</Link> untuk melihat laporan.</p>;
  if (error && !report) return <p role="alert">{error}</p>;
  if (!report) return <p role="status">Memuat detail laporan…</p>;
  return <article className="detail-card">
    <span className={`status-chip ${report.status.toLowerCase()}`}>{statusLabels[report.status]}</span>
    <h2>{categoryLabels[report.category]} · {report.location_text}</h2>
    <dl className="detail-grid"><div><dt>Deskripsi</dt><dd>{report.description}</dd></div>
      <div><dt>Dikirim</dt><dd>{new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(report.created_at))} WIB</dd></div>
      {report.staff_note && <div><dt>Catatan petugas</dt><dd>{report.staff_note}</dd></div>}</dl>
    {photoUrl && <div><h3>Foto laporan</h3><img src={photoUrl} alt="Foto bukti yang diunggah pelapor"/></div>}
    {!!history.length && <div><h3>Riwayat tindak lanjut</h3><ol>{history.map(item => <li key={item.id}>
      {statusLabels[item.new_status as EnvironmentReport["status"]] ?? item.new_status} · {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(item.created_at))}
      {item.note ? ` — ${item.note}` : ""}</li>)}</ol></div>}
    {isStaff(session.role) && (canTransition(report.status,"DIPROSES") || canTransition(report.status,"SELESAI") || canTransition(report.status,"DITOLAK")) &&
      <div className="staff-actions"><h3>Tindak lanjut petugas</h3><label>Catatan petugas
        <textarea value={note} maxLength={1000} onChange={event => setNote(event.target.value)} placeholder="Wajib untuk menolak laporan"/></label>
        <div className="secondary-actions">
          {canTransition(report.status,"DIPROSES") && <button className="blue-pill" disabled={busy} onClick={() => transition("DIPROSES")}>Proses</button>}
          {canTransition(report.status,"SELESAI") && <button className="blue-pill" disabled={busy} onClick={() => transition("SELESAI")}>Selesaikan</button>}
          {canTransition(report.status,"DITOLAK") && <button className="black-pill" disabled={busy} onClick={() => transition("DITOLAK")}>Tolak</button>}
        </div>{error && <p role="alert" className="form-message error">{error}</p>}
      </div>}
  </article>;
}
