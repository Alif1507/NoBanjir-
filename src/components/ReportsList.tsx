"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "../hooks/use-session.ts";
import { categoryLabels, reportSchema, statusLabels, type EnvironmentReport } from "../lib/reports/schema.ts";
import { z } from "zod";

export function ReportsList({ scope = "public" }: { scope?: "public" | "mine" | "staff" }) {
  const session = useSession();
  const [reports, setReports] = useState<EnvironmentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    if (scope !== "public" && !session.ready) return;
    if (scope !== "public" && !session.token) { setLoading(false); return; }
    const controller = new AbortController(); setLoading(true); setError("");
    fetch(`/api/reports?scope=${scope}`, { cache: "no-store", signal: controller.signal,
      headers: session.token ? { Authorization: `Bearer ${session.token}` } : {} }).then(async response => {
      if (!response.ok) throw new Error("Laporan belum dapat dimuat.");
      const parsed = z.object({ reports: z.array(reportSchema) }).parse(await response.json());
      if (!controller.signal.aborted) setReports(parsed.reports);
    }).catch(() => { if (!controller.signal.aborted) setError("Laporan belum dapat dimuat."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [scope, session.ready, session.token, reload]);
  if (scope !== "public" && session.ready && !session.token) return <p className="empty-state">Masuk untuk melihat laporan Anda. <Link href="/login">Masuk</Link></p>;
  const visible = scope === "staff" ? reports.filter(report =>
    (!statusFilter || report.status === statusFilter) && (!categoryFilter || report.category === categoryFilter) &&
    (!dateFilter || report.created_at.slice(0,10) === dateFilter) &&
    (!search || `${report.location_text ?? ""} ${report.description ?? ""}`.toLocaleLowerCase("id-ID").includes(search.toLocaleLowerCase("id-ID")))) : reports;
  return <div className="report-list">
    {loading && <p role="status">Memuat laporan…</p>}
    {error && <p role="alert">{error} <button onClick={() => setReload(v => v+1)}>Coba lagi</button></p>}
    {!loading && !error && !reports.length && scope !== "staff" && <p className="empty-state">Belum ada laporan pada daftar ini.</p>}
    {scope === "staff" && <div className="staff-filters" role="group" aria-label="Filter laporan">
      <label>Cari<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Lokasi atau deskripsi"/></label>
      <label>Status<select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="">Semua</option>
        {Object.entries(statusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Kategori<select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}><option value="">Semua</option>
        {Object.entries(categoryLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Tanggal<input type="date" value={dateFilter} onChange={event => setDateFilter(event.target.value)}/></label>
    </div>}
    {scope === "staff" && !loading && !error && <div className="staff-table-wrap"><table className="staff-table"><thead><tr>
      <th>Tanggal</th><th>Jenis</th><th>Lokasi</th><th>Status</th><th>Tindak lanjut</th>
    </tr></thead><tbody>{visible.map(report => <tr key={report.id}><td>{report.created_at.slice(0,10)}</td>
      <td>{categoryLabels[report.category]}</td><td>{report.location_text}</td><td>{statusLabels[report.status]}</td>
      <td><Link className="text-link" href={`/laporan/${report.id}`}>Buka ↗</Link></td></tr>)}</tbody></table>
      {!visible.length && <p className="empty-state">Tidak ada laporan yang cocok dengan filter.</p>}
      <p className="subtle-note">Menampilkan maksimal 100 laporan terbaru.</p></div>}
    {scope !== "staff" && reports.map(report => <article key={report.id}>
      <span className={`status-chip ${report.status.toLowerCase()}`}>{statusLabels[report.status]}</span>
      <h2>{categoryLabels[report.category]}{report.location_text ? ` · ${report.location_text}` : ""}</h2>
      {report.description ? <p>{report.description}</p> : <p>Ringkasan publik tanpa identitas atau isi pribadi pelapor.</p>}
      <small>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(report.created_at))}</small>
      {scope !== "public" && <p><Link className="text-link" href={`/laporan/${report.id}`}>Lihat detail ↗</Link></p>}
    </article>)}
  </div>;
}
